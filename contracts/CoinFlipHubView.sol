// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ICoinFlipStats} from "./ICoinFlipStats.sol";

/**
 * @title CoinFlipHubView
 * @notice Read-only aggregator for UI: combines balances & stats across VsComputer and PvP.
 */
contract CoinFlipHubView {
    ICoinFlipStats public immutable vsComputer;
    ICoinFlipStats public immutable pvp;

    struct CombinedStats {
        uint32 currentStreak;  // max of the two (or you can choose sum—here we do max to represent best current run)
        uint32 bestStreak;     // max of the two
        uint64 totalFlips;     // sum
        uint128 biggestWin;    // max
        uint256 combinedBalance; // sum of withdrawable userBalances
    }

    constructor(address _vsComputer, address _pvp) {
        require(_vsComputer != address(0) && _pvp != address(0), "zero addr");
        vsComputer = ICoinFlipStats(_vsComputer);
        pvp = ICoinFlipStats(_pvp);
    }

    function userCombinedBalance(address user) public view returns (uint256) {
        return vsComputer.userBalances(user) + pvp.userBalances(user);
    }

    function userCombinedStats(address user) public view returns (CombinedStats memory out) {
        (
            uint32 curA,
            uint32 bestA,
            uint64 flipsA,
            uint128 bigA
        ) = vsComputer.stats(user);

        (
            uint32 curB,
            uint32 bestB,
            uint64 flipsB,
            uint128 bigB
        ) = pvp.stats(user);

        out.currentStreak   = curA > curB ? curA : curB;              // choose the larger current run
        out.bestStreak      = bestA > bestB ? bestA : bestB;          // best of both
        out.totalFlips      = flipsA + flipsB;                        // sum
        out.biggestWin      = bigA > bigB ? bigA : bigB;              // max
        out.combinedBalance = vsComputer.userBalances(user) + pvp.userBalances(user);
    }

    // Optional: combine fee/weekly-pot views (handy for admin dashboard)
    function combinedOwnerRevenue() external view returns (uint256) {
        return vsComputer.ownerRevenue() + pvp.ownerRevenue();
    }

    function combinedWeeklyPot(uint256 weekIndex) external view returns (uint256) {
        return vsComputer.weeklyPot(weekIndex) + pvp.weeklyPot(weekIndex);
    }
}
