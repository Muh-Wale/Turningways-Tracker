// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ICoinFlipRNG} from "./ICoinFlipRNG.sol";

contract RNGMock is ICoinFlipRNG {
    uint256 public nextRequestId = 1;

    struct Pending {
        address consumer;
        bytes   data;
    }

    mapping(uint256 => Pending) public pendings;

    event RandomRequested(uint256 indexed requestId, address indexed consumer, bytes data);
    event RandomFulfilled(uint256 indexed requestId, address indexed consumer, uint256 randomWord);

    function requestRandom(address consumer, bytes calldata data)
        external
        override
        returns (uint256 requestId)
    {
        requestId = nextRequestId++;
        pendings[requestId] = Pending({ consumer: consumer, data: data });
        emit RandomRequested(requestId, consumer, data);
        // NOTE: No immediate callback here. Fulfill later via `fulfill(requestId)`.
    }

    function fulfill(uint256 requestId) external {
        Pending memory p = pendings[requestId];
        require(p.consumer != address(0), "no such request");

        // pseudo-random (NOT SECURE)
        uint256 randomWord = uint256(keccak256(abi.encode(block.timestamp, block.prevrandao, requestId)));

        delete pendings[requestId];

        (bool ok, ) = p.consumer.call(
            abi.encodeWithSignature("rngCallback(uint256,bytes,uint256)", requestId, p.data, randomWord)
        );
        require(ok, "rng callback failed");

        emit RandomFulfilled(requestId, p.consumer, randomWord);
    }
}
