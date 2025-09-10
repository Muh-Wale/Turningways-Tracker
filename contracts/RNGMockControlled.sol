// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ICoinFlipRNG} from "./ICoinFlipRNG.sol";

contract RNGMockControlled is ICoinFlipRNG {
    uint256 public nextRequestId = 1;

    struct Pending {
        address consumer;
        bytes   data;
    }

    mapping(uint256 => Pending) public pendings;
    uint256 public nextWord; // test sets this to control outcome

    event RandomRequested(uint256 indexed requestId, address indexed consumer, bytes data);
    event RandomFulfilled(uint256 indexed requestId, address indexed consumer, uint256 randomWord);

    function setNextWord(uint256 word) external {
        nextWord = word;
    }

    function requestRandom(address consumer, bytes calldata data)
        external
        override
        returns (uint256 requestId)
    {
        requestId = nextRequestId++;
        pendings[requestId] = Pending({ consumer: consumer, data: data });
        emit RandomRequested(requestId, consumer, data);
        // NOTE: No immediate callback; call fulfill(requestId) from tests.
    }

    function fulfill(uint256 requestId) external {
        Pending memory p = pendings[requestId];
        require(p.consumer != address(0), "no such request");

        uint256 randomWord = nextWord;

        delete pendings[requestId];

        (bool ok, ) = p.consumer.call(
            abi.encodeWithSignature("rngCallback(uint256,bytes,uint256)", requestId, p.data, randomWord)
        );
        require(ok, "rng callback failed");

        emit RandomFulfilled(requestId, p.consumer, randomWord);
    }
}
