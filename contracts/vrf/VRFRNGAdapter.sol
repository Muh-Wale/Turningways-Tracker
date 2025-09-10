// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// --- Chainlink VRF v2/v2.5 ---
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import { VRFCoordinatorV2Interface } from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";

// --- Access ---
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// --- Your RNG interface ---
import {ICoinFlipRNG} from "../ICoinFlipRNG.sol";

/**
 * @title VRFRNGAdapter
 * @notice Adapts Chainlink VRF to your ICoinFlipRNG so both game contracts can stay unchanged.
 * @dev Deploy once per network, configure, and set as RNG in your games via setRng(...).
 */
contract VRFRNGAdapter is ICoinFlipRNG, VRFConsumerBaseV2, Ownable {
    struct Pending {
        address target; // game contract expecting rngCallback
        bytes   data;   // opaque context to pass back
    }

    VRFCoordinatorV2Interface public immutable coordinator;

    // --- Chainlink config (editable by owner) ---
    uint64  public subscriptionId;      // Chainlink VRF subscription ID
    bytes32 public keyHash;             // gas lane / key hash
    uint32  public callbackGasLimit = 500_000; // adjust per game settlement cost
    uint16  public requestConfirmations = 3;   // min 2 on most networks
    uint32  public numWords = 1;        // we only need one 256-bit word

    mapping(uint256 => Pending) public requests; // requestId => Pending

    event VRFRequested(uint256 indexed requestId, address indexed target);
    event VRFFulfilled(uint256 indexed requestId, address indexed target, uint256 randomWord);
    event VRFConfigUpdated(uint64 subId, bytes32 keyHash, uint32 gasLimit, uint16 confirmations, uint32 numWords);

    constructor(
        address _coordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash,
        address _initialOwner
    ) VRFConsumerBaseV2(_coordinator) Ownable(_initialOwner) {
        require(_coordinator != address(0), "coordinator=0");
        coordinator = VRFCoordinatorV2Interface(_coordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
    }

    // -------------------------------------------------
    // ICoinFlipRNG
    // -------------------------------------------------
    /**
     * @dev Games call this to request randomness. We store (target,data) and forward to VRF.
     */
    function requestRandom(address callbackTarget, bytes calldata data)
        external
        override
        returns (uint256 requestId)
    {
        require(callbackTarget != address(0), "target=0");

        requestId = coordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        requests[requestId] = Pending({ target: callbackTarget, data: data });
        emit VRFRequested(requestId, callbackTarget);
    }

    // -------------------------------------------------
    // VRF Callback
    // -------------------------------------------------
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        Pending memory p = requests[requestId];
        // If there is no pending, silently ignore (or revert if you prefer strictness)
        if (p.target == address(0)) return;

        // Your game expects: rngCallback(requestId, data, randomWord)
        // We use low-level call to avoid importing the game interface here.
        (bool ok, ) = p.target.call(
            abi.encodeWithSignature(
                "rngCallback(uint256,bytes,uint256)",
                requestId,
                p.data,
                randomWords[0]
            )
        );

        // Clean up regardless; game has its own checks
        delete requests[requestId];

        emit VRFFulfilled(requestId, p.target, randomWords[0]);

        // Optional: if you want strict guarantees, you can require(ok) here.
        // require(ok, "rngCallback failed");
        // We leave it non-reverting so a single bad call doesn't brick the adapter.
        if (!ok) {
            // no-op: you could emit a separate failure event if desired
        }
    }

    // -------------------------------------------------
    // Admin setters
    // -------------------------------------------------
    function setSubscriptionId(uint64 _subId) external onlyOwner {
        subscriptionId = _subId;
        emit VRFConfigUpdated(subscriptionId, keyHash, callbackGasLimit, requestConfirmations, numWords);
    }

    function setKeyHash(bytes32 _keyHash) external onlyOwner {
        keyHash = _keyHash;
        emit VRFConfigUpdated(subscriptionId, keyHash, callbackGasLimit, requestConfirmations, numWords);
    }

    function setCallbackGasLimit(uint32 _limit) external onlyOwner {
        callbackGasLimit = _limit;
        emit VRFConfigUpdated(subscriptionId, keyHash, callbackGasLimit, requestConfirmations, numWords);
    }

    function setRequestConfirmations(uint16 _conf) external onlyOwner {
        requestConfirmations = _conf;
        emit VRFConfigUpdated(subscriptionId, keyHash, callbackGasLimit, requestConfirmations, numWords);
    }

    function setNumWords(uint32 _num) external onlyOwner {
        require(_num >= 1 && _num <= 10, "numWords out of range");
        numWords = _num;
        emit VRFConfigUpdated(subscriptionId, keyHash, callbackGasLimit, requestConfirmations, numWords);
    }
}
