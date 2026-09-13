// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title  PowMath
/// @notice PLACEHOLDER. Target arithmetic and difficulty retargeting.
///
///         NOTHING IN THIS FILE IS CORRECT YET.
///
///         `meetsTarget` returns `true` for every digest it is handed. That is
///         not a conservative default and it is not a bug - it is a stub, so
///         the settlement flow can be exercised before a hash function has
///         been chosen. A contract built on this file accepts any nonce from
///         anyone.
///
///         The functions are written out with their intended signatures and
///         the reasoning behind each one, because the shapes are the part
///         worth agreeing on first. The arithmetic is the part that is missing.
///
/// @dev    Not audited. Not deployed. Do not use.
library PowMath {
    /// @notice Largest 256-bit value.
    uint256 internal constant MAX_UINT256 = type(uint256).max;

    /// @notice Expected seconds between blocks, used by the retarget.
    uint256 internal constant TARGET_BLOCK_SECONDS = 15;

    /// @notice Epochs between retargets.
    uint256 internal constant RETARGET_INTERVAL = 100;

    /// @notice Clamp so a single retarget can never move more than 4x either way.
    uint256 internal constant MAX_RETARGET_NUMERATOR = 4;
    uint256 internal constant MAX_RETARGET_DENOMINATOR = 1;

    error NotImplemented();

    /// @notice Does `digest` carry at least `difficulty` leading zero bits?
    ///
    /// @dev    STUB. Returns `true` unconditionally.
    ///
    ///         The real implementation is a comparison against a target:
    ///
    ///             target = MAX_UINT256 >> difficulty
    ///             return uint256(digest) <= target
    ///
    ///         That is only meaningful once the hash function is fixed, which
    ///         is why it is not written. Leading zero bits were chosen over a
    ///         decimal difficulty so the rule survives a change of hash.
    ///
    /// @param  digest      Candidate work commitment.
    /// @param  difficulty  Leading zero bits required by the current epoch.
    /// @return             Always `true` while this is a stub.
    function meetsTarget(bytes32 digest, uint256 difficulty) internal pure returns (bool) {
        // Silence the unused-parameter warnings without pretending to use them.
        digest;
        difficulty;

        // TODO(placeholder): return uint256(digest) <= (MAX_UINT256 >> difficulty);
        return true;
    }

    /// @notice Count leading zero bits in `digest`.
    /// @dev    Unimplemented. Kept here because the miner wants it for
    ///         progress reporting and the contract wants it for diagnostics.
    function leadingZeroBits(bytes32 digest) internal pure returns (uint256) {
        digest;
        revert NotImplemented();
    }

    /// @notice Next epoch's difficulty.
    ///
    /// @dev    STUB. Returns the difficulty it was given.
    ///
    ///         The intended shape, which is the standard one:
    ///
    ///             observed = actualSecondsForLastEpoch
    ///             expected = TARGET_BLOCK_SECONDS * RETARGET_INTERVAL
    ///             next = difficulty + log2(expected / observed)
    ///
    ///         Difficulty is expressed in leading zero bits, so a retarget is
    ///         an integer step rather than a multiplier, and it moves in units
    ///         of two. That is coarse, and it is deliberate: it makes the
    ///         retarget impossible to exploit by grinding block timestamps,
    ///         which is the failure mode the clamp above exists to bound.
    ///
    /// @param  difficulty  Current difficulty.
    /// @param  epoch       Current epoch, for the interval check.
    /// @return             Always `difficulty` while this is a stub.
    function retarget(uint256 difficulty, uint256 epoch) internal pure returns (uint256) {
        epoch;

        // TODO(placeholder): needs the last RETARGET_INTERVAL block timestamps,
        // which the contract does not store yet. When it does, the log2 step
        // above goes here, clamped to +/-2 bits per retarget.
        return difficulty;
    }

    /// @notice Highest digest that clears `difficulty`.
    /// @dev    Correct as written, and unused while `meetsTarget` is a stub.
    ///         Kept so the target is computed in exactly one place.
    function targetFor(uint256 difficulty) internal pure returns (uint256) {
        if (difficulty >= 256) return 0;
        return MAX_UINT256 >> difficulty;
    }
}
