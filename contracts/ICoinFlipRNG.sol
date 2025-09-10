// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICoinFlipRNG {
    function requestRandom(
        address consumer,
        bytes calldata data
    ) external returns (uint256 requestId);
}
