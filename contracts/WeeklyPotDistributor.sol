// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IWeeklyPotSettle} from "./IWeeklyPotSettle.sol";

/**
 * @title WeeklyPotDistributor
 * @notice Batches weekly pot settlements across multiple game contracts.
 * @dev Must be set as owner of target game contracts (transferOwnership to this).
 */
contract WeeklyPotDistributor is Ownable, ReentrancyGuard {
    constructor(address initialOwner) Ownable(initialOwner) {}

    event BatchSettled(
        uint256 indexed weekIndex,
        address indexed vsComputer,
        address indexed pvp,
        uint256 paidVsComputer,
        uint256 paidPvP
    );

    /**
     * @notice Settle both contracts' weekly pots in one tx.
     * @dev This contract must be the owner of both target contracts.
     */
    function distributeForBoth(
        uint256 weekIndex,
        address vsComputer,
        address pvp,
        address[] calldata winnersVs,
        uint256[] calldata sharesVsBps,
        address[] calldata winnersPvp,
        uint256[] calldata sharesPvpBps
    ) external onlyOwner nonReentrant {
        uint256 paidVs;
        uint256 paidPv;

        // ---- VS COMPUTER (scoped) ----
        {
            IWeeklyPotSettle vs = IWeeklyPotSettle(vsComputer);
            uint256 pot = vs.weeklyPot(weekIndex);
            if (pot > 0 && !vs.weeklyPotDistributed(weekIndex)) {
                _requireSharesSum(sharesVsBps);
                vs.distributeWeeklyPot(weekIndex, winnersVs, sharesVsBps);
                paidVs = pot; // informational (actual paid may differ by rounding dust)
            }
        }

        // ---- PVP (scoped) ----
        {
            IWeeklyPotSettle pv = IWeeklyPotSettle(pvp);
            uint256 pot = pv.weeklyPot(weekIndex);
            if (pot > 0 && !pv.weeklyPotDistributed(weekIndex)) {
                _requireSharesSum(sharesPvpBps);
                pv.distributeWeeklyPot(weekIndex, winnersPvp, sharesPvpBps);
                paidPv = pot;
            }
        }

        emit BatchSettled(weekIndex, vsComputer, pvp, paidVs, paidPv);
    }

    // --------- Preview helpers (for UI) ---------
    /**
     * @notice Pure preview for a single pot.
     * @param pot The total pot amount.
     * @param sharesBps Shares in BPS (must sum to 10000).
     * @return total sum of payouts
     * @return payouts array of per-winner payouts
     * @return leftover rounding dust
     */
    function previewShares(
        uint256 pot,
        uint256[] calldata sharesBps
    ) public pure returns (uint256 total, uint256[] memory payouts, uint256 leftover) {
        _requireSharesSum(sharesBps);
        payouts = new uint256[](sharesBps.length);

        uint256 paid;
        for (uint256 i = 0; i < sharesBps.length; i++) {
            uint256 amt = (pot * sharesBps[i]) / 10_000;
            payouts[i] = amt;
            paid += amt;
        }
        total = paid;
        leftover = pot - paid;
    }

    /**
     * @notice Preview payouts for both contracts for a given week.
     */
    function previewBoth(
        uint256 weekIndex,
        address vsComputer,
        address pvp,
        uint256[] calldata sharesVsBps,
        uint256[] calldata sharesPvpBps
    ) external view returns (
        uint256 potVs,
        uint256 totalVs,
        uint256[] memory payoutsVs,
        uint256 leftoverVs,
        uint256 potPv,
        uint256 totalPv,
        uint256[] memory payoutsPv,
        uint256 leftoverPv
    ) {
        // VS
        {
            IWeeklyPotSettle vs = IWeeklyPotSettle(vsComputer);
            potVs = vs.weeklyPot(weekIndex);
            (totalVs, payoutsVs, leftoverVs) = previewShares(potVs, sharesVsBps);
        }
        // PVP
        {
            IWeeklyPotSettle pv = IWeeklyPotSettle(pvp);
            potPv = pv.weeklyPot(weekIndex);
            (totalPv, payoutsPv, leftoverPv) = previewShares(potPv, sharesPvpBps);
        }
    }

    // ---- Internal ----
    function _requireSharesSum(uint256[] calldata sharesBps) internal pure {
        uint256 sum;
        unchecked {
            for (uint256 i = 0; i < sharesBps.length; i++) sum += sharesBps[i];
        }
        require(sum == 10_000, "shares != 100%");
    }
}
