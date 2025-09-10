// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IWeeklyPotSettle {
    // Read-only helpers the distributor may use (optional)
    function weeklyPot(uint256 weekIndex) external view returns (uint256);
    function weeklyPotDistributed(uint256 weekIndex) external view returns (bool);

    // Must be present on target contracts (we added this earlier)
    function distributeWeeklyPot(
        uint256 weekIndex,
        address[] calldata winners,
        uint256[] calldata sharesBps
    ) external;
}
