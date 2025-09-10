// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICoinFlipStats {
    // User accounting
    function userBalances(address user) external view returns (uint256);
    // Stats struct needs a getter returning this tuple order:
    // (currentStreak, bestStreak, totalFlips, biggestWin)
    function stats(address user) external view returns (
        uint32 currentStreak,
        uint32 bestStreak,
        uint64 totalFlips,
        uint128 biggestWin
    );

    // Optional fee/treasury data (for dashboards)
    function ownerRevenue() external view returns (uint256);
    function weeklyPot(uint256 weekIndex) external view returns (uint256);
}