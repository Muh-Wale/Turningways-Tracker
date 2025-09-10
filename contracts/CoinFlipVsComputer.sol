// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol"; // OZ v5
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ICoinFlipRNG} from "./ICoinFlipRNG.sol";

/**
 * @title CoinFlipVsComputer
 * @notice Single-player coin flip vs computer with streak multiplier and fee split.
 * @dev Randomness is abstracted via ICoinFlipRNG so you can plug Chainlink VRF later.
 */
contract CoinFlipVsComputer is Ownable, ReentrancyGuard {
    // -------- Types --------
    enum Side {
        HEADS,
        TAILS
    }

    struct Bet {
        address player;
        uint96 amount; // bet amount (wei)
        Side side; // player's pick
        bool settled;
    }

    struct UserStats {
        uint32 currentStreak;
        uint32 bestStreak;
        uint64 totalFlips;
        uint128 biggestWin; // net paid to user (after fees)
    }

    // -------- Config (public) --------
    uint256 public minBet; // e.g. 0.00025 ether
    uint256 public maxBet; // e.g. 0.01 ether

    uint256 public platformFeeBps = 200; // 2% (on payout)
    uint256 public treasuryBps = 5000; // 50% of fee -> treasury
    uint256 public weeklyPotBps = 2000; // 20% of fee -> weekly pot
    uint256 public constant BPS_DENOM = 10_000;

    // multiplier is scaled by 100: 100 = 1.00x, 110 = 1.10x
    uint256 public maxMultiplierScaled = 200; // cap 2.00x

    address public treasury; // community treasury recipient
    ICoinFlipRNG public rng; // randomness provider

    // -------- Accounting --------
    mapping(address => uint256) public userBalances; // winnings to withdraw
    uint256 public ownerRevenue; // owner’s fee share
    mapping(uint256 => uint256) public weeklyPot; // weekIndex => balance
    mapping(uint256 => bool) public weeklyPotDistributed; // Tracks if a given week's pot has already been settled

    // -------- State --------
    mapping(uint256 => Bet) public betsByRequest; // RNG requestId -> Bet
    mapping(address => UserStats) public stats; // user stats

    // -------- Events --------
    event BetPlaced(
        uint256 indexed requestId,
        address indexed player,
        Side side,
        uint256 amount
    );
    event BetSettled(
        uint256 indexed requestId,
        address indexed player,
        Side outcome,
        bool playerWon,
        uint256 payout,
        uint256 fee,
        uint256 netToPlayer
    );
    event StreakUpdated(address indexed player, uint32 current, uint32 best);
    event UserWithdrawn(address indexed user, uint256 amount);
    event FeeAccrued(
        uint256 fee,
        uint256 toTreasury,
        uint256 toWeekly,
        uint256 toOwner,
        uint256 weekIndex
    );
    event WeeklyPotDistributed(
        uint256 indexed weekIndex,
        address[] winners,
        uint256[] sharesBps,
        uint256 totalPaid,
        uint256 leftover
    );

    // -------- Constructor (OZ v5 Ownable) --------
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

    // -------- Modifiers & Utils --------
    modifier betInRange() {
        require(msg.value >= minBet && msg.value <= maxBet, "bet out of range");
        _;
    }

    function _weekIndex() internal view returns (uint256) {
        return block.timestamp / 1 weeks; // UTC week
    }

    function _weekEndTimestamp(
        uint256 weekIndex
    ) internal pure returns (uint256) {
        // weekIndex is floor(block.timestamp / 1 weeks). End is (weekIndex + 1) * 1 weeks.
        return (weekIndex + 1) * 1 weeks;
    }

    function _multiplierScaled(address user) internal view returns (uint256) {
        // +0.1 (i.e., +10 scaled) for every 3 consecutive wins
        uint256 consec = stats[user].currentStreak;
        uint256 step = consec / 3;
        uint256 scaled = 100 + (step * 10);
        if (scaled > maxMultiplierScaled) scaled = maxMultiplierScaled;
        return scaled;
    }

    // -------- Core: Place Bet --------
    function playVsComputer(
        Side side
    ) external payable nonReentrant betInRange returns (uint256 requestId) {
        // Emit a randomness request via RNG provider. We pack caller context in `data`.
        bytes memory data = abi.encode(msg.sender, uint96(msg.value), side);
        requestId = rng.requestRandom(address(this), data);

        // Record pending bet
        betsByRequest[requestId] = Bet({
            player: msg.sender,
            amount: uint96(msg.value),
            side: side,
            settled: false
        });

        emit BetPlaced(requestId, msg.sender, side, msg.value);
    }

    /**
     * @notice RNG callback. The RNG must call this with the original data and a 256-bit random number.
     * @dev Access restricted to the RNG provider (msg.sender == address(rng)).
     */
    function rngCallback(
        uint256 requestId,
        bytes calldata /*data*/,
        uint256 randomWord
    ) external nonReentrant {
        require(msg.sender == address(rng), "unauthorized RNG");
        Bet storage b = betsByRequest[requestId];
        require(!b.settled && b.player != address(0), "bet not found/settled");

        // ---- Outcome (keep locals minimal) ----
        Side outcome = (randomWord & 1 == 0) ? Side.HEADS : Side.TAILS;
        bool playerWon = (outcome == b.side);

        // ---- Compute payout/fee in a tight scope to free stack slots early ----
        uint256 payout;
        uint256 fee;
        uint256 netToPlayer;
        {
            uint256 basePot = uint256(b.amount) * 2;
            uint256 multScaled = _multiplierScaled(b.player);
            payout = (basePot * multScaled) / 100; // scaled by 100

            fee = (payout * platformFeeBps) / BPS_DENOM;
            if (fee > payout) fee = payout;
            uint256 net = payout - fee;

            if (playerWon) {
                userBalances[b.player] += net;
                netToPlayer = net;

                // update stats on win
                UserStats storage s = stats[b.player];
                unchecked {
                    s.totalFlips += 1;
                }
                s.currentStreak += 1;
                if (s.currentStreak > s.bestStreak)
                    s.bestStreak = s.currentStreak;
                if (net > s.biggestWin) s.biggestWin = uint128(net);
                emit StreakUpdated(b.player, s.currentStreak, s.bestStreak);
            } else {
                // update stats on loss
                UserStats storage s2 = stats[b.player];
                unchecked {
                    s2.totalFlips += 1;
                }
                s2.currentStreak = 0;
                emit StreakUpdated(b.player, 0, s2.bestStreak);
            }
        }

        // ---- Fee split (separate block; previous temps out of scope) ----
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

        // ---- Finalize ----
        b.settled = true;
        emit BetSettled(
            requestId,
            b.player,
            outcome,
            playerWon,
            payout,
            fee,
            netToPlayer
        );
    }

    // -------- Withdrawals --------
    function withdraw(uint256 amount) external nonReentrant {
        require(userBalances[msg.sender] >= amount, "insufficient");
        userBalances[msg.sender] -= amount;
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "transfer fail");
        emit UserWithdrawn(msg.sender, amount);
    }

    function ownerWithdraw(uint256 amount) external onlyOwner nonReentrant {
        require(ownerRevenue >= amount, "insufficient revenue");
        ownerRevenue -= amount;
        (bool sent, ) = payable(owner()).call{value: amount}("");
        require(sent, "transfer fail");
    }

    // -------- Admin Setters --------
    function setRng(address _rng) external onlyOwner {
        require(_rng != address(0), "zero addr");
        rng = ICoinFlipRNG(_rng);
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "zero addr");
        treasury = _treasury;
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
        require(_platformFeeBps <= 1_000, "fee too high"); // cap 10%
        require(_treasuryBps + _weeklyPotBps <= BPS_DENOM, "split >100%");
        platformFeeBps = _platformFeeBps;
        treasuryBps = _treasuryBps;
        weeklyPotBps = _weeklyPotBps;
    }

    function setMaxMultiplierScaled(uint256 _scaled) external onlyOwner {
        require(_scaled >= 100, "min 1.00x");
        maxMultiplierScaled = _scaled;
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

    // -------- Funding --------
    receive() external payable {}
    fallback() external payable {}
}
