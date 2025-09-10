// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ICoinFlipRNG} from "./ICoinFlipRNG.sol";

contract CoinFlipPvP is Ownable, ReentrancyGuard {
    enum Side {
        HEADS,
        TAILS
    }

    struct Lobby {
        address creator;
        uint96 amount;
        Side creatorSide;
        uint40 expiresAt;
        bool joined;
        address joiner;
        bool settled;
        uint256 requestId;
    }

    struct UserStats {
        uint32 currentStreak;
        uint32 bestStreak;
        uint64 totalFlips;
        uint128 biggestWin; // net to user (after fees)
    }

    // --- Config ---
    uint256 public minBet;
    uint256 public maxBet;
    ICoinFlipRNG public rng;

    // fees (bps)
    uint256 public platformFeeBps = 200; // 2%
    uint256 public treasuryBps = 5000; // 50% of fee -> treasury
    uint256 public weeklyPotBps = 2000; // 20% of fee -> weekly pot
    uint256 public constant BPS_DENOM = 10_000;

    // multiplier scaled by 100 (100 = 1.00x). +0.1 per 3-win streak, capped:
    uint256 public maxMultiplierScaled = 200; // 2.00x cap

    address public treasury;

    // --- State ---
    uint256 public nextLobbyId = 1;
    mapping(uint256 => Lobby) public lobbies;
    mapping(uint256 => uint256) public reqToLobby;

    mapping(address => uint256) public userBalances;
    mapping(address => UserStats) public stats;

    uint256 public ownerRevenue;
    mapping(uint256 => uint256) public weeklyPot;

    mapping(uint256 => bool) public weeklyPotDistributed; // Tracks if a given week's pot has already been settled

    // --- Events ---
    event LobbyCreated(
        uint256 indexed id,
        address indexed creator,
        Side side,
        uint256 amount,
        uint256 expiresAt
    );
    event LobbyCancelled(uint256 indexed id, address indexed creator);
    event LobbyJoined(uint256 indexed id, address indexed joiner);
    event MatchRequested(uint256 indexed requestId, uint256 indexed lobbyId);
    event MatchSettled(
        uint256 indexed requestId,
        uint256 indexed lobbyId,
        address winner,
        address loser,
        Side outcome,
        uint256 payout, // gross (pre-fee)
        uint256 fee, // fee taken
        uint256 netToWinner // credited to winner
    );
    event StreakUpdated(address indexed user, uint32 current, uint32 best);
    event FeeAccrued(
        uint256 fee,
        uint256 toTreasury,
        uint256 toWeekly,
        uint256 toOwner,
        uint256 weekIndex
    );
    event UserWithdrawn(address indexed user, uint256 amount);
    event WeeklyPotDistributed(
        uint256 indexed weekIndex,
        address[] winners,
        uint256[] sharesBps,
        uint256 totalPaid,
        uint256 leftover
    );

    constructor(
        address _rng,
        address _treasury,
        uint256 _minBet,
        uint256 _maxBet
    ) Ownable(msg.sender) {
        require(_rng != address(0) && _treasury != address(0), "zero addr");
        require(_minBet > 0 && _minBet <= _maxBet, "bad bet bounds");
        rng = ICoinFlipRNG(_rng);
        treasury = _treasury;
        minBet = _minBet;
        maxBet = _maxBet;
    }

    // --- Modifiers/Utils ---
    modifier betInRange() {
        require(msg.value >= minBet && msg.value <= maxBet, "bet out of range");
        _;
    }

    function _weekIndex() internal view returns (uint256) {
        return block.timestamp / 1 weeks;
    }

    function _multiplierScaled(address user) internal view returns (uint256) {
        uint256 consec = stats[user].currentStreak;
        uint256 steps = consec / 3;
        uint256 scaled = 100 + steps * 10;
        if (scaled > maxMultiplierScaled) scaled = maxMultiplierScaled;
        return scaled;
    }

    function _weekEndTimestamp(
        uint256 weekIndex
    ) internal pure returns (uint256) {
        // weekIndex is floor(block.timestamp / 1 weeks). End is (weekIndex + 1) * 1 weeks.
        return (weekIndex + 1) * 1 weeks;
    }

    // --- Core flows ---
    function createLobby(
        Side side
    ) external payable nonReentrant betInRange returns (uint256 id) {
        id = nextLobbyId++;
        lobbies[id] = Lobby({
            creator: msg.sender,
            amount: uint96(msg.value),
            creatorSide: side,
            expiresAt: uint40(block.timestamp + 60),
            joined: false,
            joiner: address(0),
            settled: false,
            requestId: 0
        });
        emit LobbyCreated(
            id,
            msg.sender,
            side,
            msg.value,
            lobbies[id].expiresAt
        );
    }

    function cancelLobby(uint256 id) external nonReentrant {
        Lobby storage lb = lobbies[id];
        require(lb.creator != address(0), "no lobby");
        require(lb.creator == msg.sender, "not creator");
        require(!lb.joined, "already joined");
        require(!lb.settled, "already settled");
        require(block.timestamp >= lb.expiresAt, "not expired");

        uint256 amt = lb.amount;
        lb.amount = 0;
        lb.settled = true;

        (bool ok, ) = payable(msg.sender).call{value: amt}("");
        require(ok, "refund fail");
        emit LobbyCancelled(id, msg.sender);
    }

    function joinLobby(uint256 id) external payable nonReentrant {
        Lobby storage lb = lobbies[id];
        require(lb.creator != address(0), "no lobby");
        require(!lb.joined && !lb.settled, "unavailable");
        require(block.timestamp < lb.expiresAt, "expired");
        require(msg.sender != lb.creator, "self join");
        require(msg.value == lb.amount, "must match bet");

        lb.joined = true;
        lb.joiner = msg.sender;

        bytes memory data = abi.encode(id);
        uint256 requestId = rng.requestRandom(address(this), data);
        lb.requestId = requestId;
        reqToLobby[requestId] = id;

        emit LobbyJoined(id, msg.sender);
        emit MatchRequested(requestId, id);
    }

    function rngCallback(
        uint256 requestId,
        bytes calldata /*data*/,
        uint256 randomWord
    ) external nonReentrant {
        require(msg.sender == address(rng), "unauthorized RNG");
        uint256 id = reqToLobby[requestId];
        Lobby storage lb = lobbies[id];
        require(lb.creator != address(0), "no lobby");
        require(lb.joined && !lb.settled, "bad state");

        Side outcome = (randomWord & 1 == 0) ? Side.HEADS : Side.TAILS;

        address winner = (outcome == lb.creatorSide) ? lb.creator : lb.joiner;
        address loser = (winner == lb.creator) ? lb.joiner : lb.creator;

        uint256 payout;
        uint256 fee;
        uint256 netToWinner;
        {
            uint256 basePot = uint256(lb.amount) * 2;
            uint256 multScaled = _multiplierScaled(winner);
            payout = (basePot * multScaled) / 100;

            fee = (payout * platformFeeBps) / BPS_DENOM;
            if (fee > payout) fee = payout;
            uint256 net = payout - fee;

            userBalances[winner] += net;
            netToWinner = net;

            UserStats storage sw = stats[winner];
            unchecked {
                sw.totalFlips += 1;
            }
            sw.currentStreak += 1;
            if (sw.currentStreak > sw.bestStreak)
                sw.bestStreak = sw.currentStreak;
            if (net > sw.biggestWin) sw.biggestWin = uint128(net);
            emit StreakUpdated(winner, sw.currentStreak, sw.bestStreak);

            UserStats storage sl = stats[loser];
            unchecked {
                sl.totalFlips += 1;
            }
            sl.currentStreak = 0;
            emit StreakUpdated(loser, 0, sl.bestStreak);
        }

        {
            uint256 toTreasury = (fee * treasuryBps) / BPS_DENOM;
            uint256 toWeekly = (fee * weeklyPotBps) / BPS_DENOM;
            uint256 toOwner = fee - toTreasury - toWeekly;
            uint256 widx = _weekIndex();

            ownerRevenue += toOwner;
            weeklyPot[widx] += toWeekly;

            (bool ok, ) = payable(treasury).call{value: toTreasury}("");
            if (!ok) ownerRevenue += toTreasury;

            emit FeeAccrued(fee, toTreasury, toWeekly, toOwner, widx);
        }

        lb.settled = true;
        delete reqToLobby[requestId];

        emit MatchSettled(
            requestId,
            id,
            winner,
            loser,
            outcome,
            payout,
            fee,
            netToWinner
        );
    }

    // --- Withdraw & admin ---
    function withdraw(uint256 amount) external nonReentrant {
        require(userBalances[msg.sender] >= amount, "insufficient");
        userBalances[msg.sender] -= amount;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "transfer fail");
        emit UserWithdrawn(msg.sender, amount);
    }

    // NEW: owner revenue withdrawal (mirrors Vs-Computer)
    function ownerWithdraw(uint256 amount) external onlyOwner nonReentrant {
        require(ownerRevenue >= amount, "insufficient revenue");
        ownerRevenue -= amount;
        (bool ok, ) = payable(owner()).call{value: amount}("");
        require(ok, "transfer fail");
    }

    // OPTIONAL: emergency sweep (owner) for stuck ETH not tracked in ledgers (e.g. self-destruct, failed treasury)
    function sweep(
        address payable to,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(to != address(0), "zero addr");
        // Don’t let owner sweep users’ or ownerRevenue accounting:
        uint256 reserved = ownerRevenue; // weeklyPot stays mapped by week; we don’t sweep it here by design
        uint256 liquid = address(this).balance - reserved;
        require(amount <= liquid, "amount > liquid");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "sweep fail");
    }

    function setRng(address _rng) external onlyOwner {
        require(_rng != address(0), "rng=0");
        rng = ICoinFlipRNG(_rng);
    }

    function setBetBounds(uint256 _min, uint256 _max) external onlyOwner {
        require(_min > 0 && _min <= _max, "bad bet bounds");
        minBet = _min;
        maxBet = _max;
    }

    function setFees(
        uint256 _platformFeeBps,
        uint256 _treasuryBps,
        uint256 _weeklyPotBps
    ) external onlyOwner {
        require(_platformFeeBps <= 1000, "fee too high");
        require(_treasuryBps + _weeklyPotBps <= BPS_DENOM, "split >100%");
        platformFeeBps = _platformFeeBps;
        treasuryBps = _treasuryBps;
        weeklyPotBps = _weeklyPotBps;
    }

    function setMaxMultiplierScaled(uint256 _scaled) external onlyOwner {
        require(_scaled >= 100, "min 1.00x");
        maxMultiplierScaled = _scaled;
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "zero addr");
        treasury = _treasury;
    }

    /**
     * @notice Owner-admin settlement for a given week's pot.
     * @param weekIndex The week to settle (block.timestamp / 1 weeks).
     * @param winners   Addresses to receive a share of the weekly pot.
     * @param sharesBps Basis points per winner; MUST sum to 10_000 (100%).
     *
     * Credits winners' userBalances; users withdraw normally.
     * Can only be called once per week after the week has ended.
     */
    function distributeWeeklyPot(
        uint256 weekIndex,
        address[] calldata winners,
        uint256[] calldata sharesBps
    ) external onlyOwner nonReentrant {
        require(winners.length == sharesBps.length, "length mismatch");
        require(!weeklyPotDistributed[weekIndex], "already settled");
        require(
            block.timestamp >= _weekEndTimestamp(weekIndex),
            "week not ended"
        );

        uint256 pot = weeklyPot[weekIndex];
        require(pot > 0, "no pot");

        uint256 totalBps = 0;
        unchecked {
            for (uint256 i = 0; i < sharesBps.length; i++) {
                totalBps += sharesBps[i];
            }
        }
        require(totalBps == 10_000, "shares must sum to 100%");

        uint256 totalPaid = 0;
        for (uint256 i = 0; i < winners.length; i++) {
            address w = winners[i];
            require(w != address(0), "zero winner");
            uint256 amount = (pot * sharesBps[i]) / 10_000;
            if (amount > 0) {
                userBalances[w] += amount;
                totalPaid += amount;
            }
        }

        // handle any rounding dust
        uint256 leftover = pot - totalPaid;
        weeklyPot[weekIndex] = leftover; // keep dust recorded (optional: could add to next week or ownerRevenue)

        weeklyPotDistributed[weekIndex] = true;
        emit WeeklyPotDistributed(
            weekIndex,
            winners,
            sharesBps,
            totalPaid,
            leftover
        );
    }

    receive() external payable {}
    fallback() external payable {}
}
