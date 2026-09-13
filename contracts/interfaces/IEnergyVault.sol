// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title  IEnergyVault
/// @notice PLACEHOLDER. The downstream half of the JOULE split.
///
///         This is the only thing `JoulePow` talks to once a block is settled.
///         It receives the "power" half of every fee and turns it into
///         energy-sector equity held on the miner's behalf.
///
///         THERE IS NO IMPLEMENTATION OF THIS INTERFACE ANYWHERE IN THIS
///         REPOSITORY. It is declared so the settlement contract has something
///         to compile against and so the boundary is written down. Until an
///         implementation exists, the split is bookkeeping and nothing more.
///
/// @dev    Not audited. Not deployed. Do not use.
interface IEnergyVault {
    /// @notice Take the power half of a fee and buy equity with it.
    /// @param  beneficiary  The miner the resulting position belongs to.
    /// @dev    Payable. Called by `JoulePow._split` with the non-burn half.
    function depositFor(address beneficiary) external payable;

    /// @notice Value currently held in the vault on `account`'s behalf.
    /// @dev    A real implementation reports a position, not a balance, since
    ///         the whole point is that the miner is paid in equity rather than
    ///         in the coin they just made scarcer. What unit that comes back
    ///         in is not decided yet.
    function positionOf(address account) external view returns (uint256);

    /// @notice Total value the vault has taken in over its lifetime.
    function totalDeposited() external view returns (uint256);

    /// @notice Value the vault has spent buying equity over its lifetime.
    function totalDeployed() external view returns (uint256);

    /// @notice Emitted on every `depositFor`.
    /// @param  beneficiary  The miner the position belongs to.
    /// @param  amount       Value received.
    /// @param  epoch        Epoch the settlement happened in.
    event Deposited(address indexed beneficiary, uint256 amount, uint256 epoch);

    /// @notice Emitted when the vault converts held value into equity.
    /// @param  amount       Value spent.
    /// @param  reference    Off-chain identifier for the purchase.
    event Deployed(uint256 amount, bytes32 reference);
}
