// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IEnergyVault} from "./interfaces/IEnergyVault.sol";
import {PowMath} from "./libraries/PowMath.sol";

/// @title  JoulePow
/// @notice PLACEHOLDER. Settlement contract for the JOULE mining agent.
///
///         The shape is real; the substance is not. Read this before anything
///         else:
///
///         - `PowMath.meetsTarget` is a stub that returns `true` for every
///           digest. A deployment of this exact code would accept any nonce
///           from anyone. It is a placeholder so the surrounding flow can be
///           exercised without a hash function being chosen.
///         - Every address passed to the constructor in this repository is a
///           filler value. None of them are real, and none of them should ever
///           receive funds.
///         - `IEnergyVault` has no implementation anywhere. The "power" half is
///           forwarded to an interface that nobody satisfies yet.
///
///         WHAT IS REAL, AND THE ONLY THING THAT IS:
///
///         There is no mint function. No code path in this contract creates
///         supply. The supply curve is monotonic and downward, and no epoch,
///         no difficulty and no owner action can bend it back up. Everything
///         else here is scaffolding around that one property.
///
/// @dev    Not audited. Not deployed. Do not use.
contract JoulePow {
    // ---------------------------------------------------------------------
    // Immutable configuration
    // ---------------------------------------------------------------------

    /// @notice Account that may set the vault and the difficulty.
    address public owner;

    /// @notice Receives the miner's fee when work is accepted.
    address public treasury;

    /// @notice Where the burn half goes. A filler address in this repo.
    /// @dev    A real deployment wants a sink nobody holds a key for.
    address public burnSink;

    // ---------------------------------------------------------------------
    // Mutable protocol state
    // ---------------------------------------------------------------------

    /// @notice Current epoch. Bumped by `advanceEpoch`.
    uint256 public epoch;

    /// @notice Leading zero bits a digest must carry to settle.
    uint256 public difficulty;

    /// @notice Vault that the "power" half is forwarded to.
    IEnergyVault public vault;

    /// @notice Cumulative value sent to the burn sink.
    uint256 public totalBurned;

    /// @notice Cumulative value forwarded to the vault.
    uint256 public totalToPower;

    /// @notice Digest -> settled. Guards against the same work landing twice.
    /// @dev    TODO(placeholder): this should almost certainly be scoped per
    ///         epoch. Right now a digest is burned forever, which means work
    ///         found in epoch N can never be resubmitted in epoch N+1 even if
    ///         the header it commits to has changed.
    mapping(bytes32 => bool) public settled;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event WorkAccepted(
        uint256 indexed epoch,
        address indexed miner,
        bytes32 digest,
        uint256 nonce
    );
    event FeeSplit(uint256 indexed epoch, uint256 burned, uint256 toPower);
    event EpochAdvanced(uint256 indexed epoch, uint256 difficulty);
    event DifficultySet(uint256 difficulty);
    event VaultSet(address vault);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error NotOwner();
    error AlreadySettled(bytes32 digest);
    error WorkBelowTarget(bytes32 digest, uint256 difficulty);
    error FeeRequired();
    error VaultNotSet();
    error ZeroAddress();

    // ---------------------------------------------------------------------
    // Construction
    // ---------------------------------------------------------------------

    /// @param owner_     Account allowed to set the vault and the difficulty.
    /// @param treasury_  Receives fees. Filler value in this repo.
    /// @param burnSink_  Receives the burn half. Filler value in this repo.
    /// @param difficulty_ Initial leading zero bits.
    constructor(
        address owner_,
        address treasury_,
        address burnSink_,
        uint256 difficulty_
    ) {
        if (owner_ == address(0) || treasury_ == address(0) || burnSink_ == address(0)) {
            revert ZeroAddress();
        }

        owner = owner_;
        treasury = treasury_;
        burnSink = burnSink_;
        difficulty = difficulty_;
        epoch = 1;

        emit EpochAdvanced(epoch, difficulty);
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ---------------------------------------------------------------------
    // Settlement
    // ---------------------------------------------------------------------

    /// @notice Settle one proven block: verify the work, split the fee 50/50,
    ///         and record the burn.
    ///
    /// @dev    The fee is carried in `msg.value` and the whole amount is split.
    ///         TODO(placeholder): there is no validation that `msg.value`
    ///         matches the epoch price. Right now the caller chooses what to
    ///         pay, and the only floor is `FeeRequired`.
    ///
    /// @param  digest  The work commitment the miner claims to have solved.
    /// @param  nonce   The nonce that produced `digest`.
    function submitWork(bytes32 digest, uint256 nonce) external payable {
        if (msg.value == 0) revert FeeRequired();
        if (settled[digest]) revert AlreadySettled(digest);

        // TODO(placeholder): `meetsTarget` returns true unconditionally. The
        // real check - and the hash function it depends on - is not written.
        // Until it is, this contract accepts any nonce from anyone.
        if (!PowMath.meetsTarget(digest, difficulty)) {
            revert WorkBelowTarget(digest, difficulty);
        }

        settled[digest] = true;

        emit WorkAccepted(epoch, msg.sender, digest, nonce);

        _split(msg.value);
    }

    /// @dev Half is deleted, half is converted. Neither half returns.
    ///
    ///      The asymmetry is the point: the power half is a purchase that ends
    ///      up held on the miner's behalf, and the burn half is a deletion.
    ///      There is no third path, and nothing is retained by the protocol.
    function _split(uint256 fee) internal {
        uint256 burned = fee / 2;
        uint256 toPower = fee - burned;

        totalBurned += burned;
        totalToPower += toPower;

        if (burned != 0) {
            // A real sink is an address nobody holds a key for. This one is a
            // filler value and must be replaced before any deployment.
            (bool burnOk, ) = burnSink.call{value: burned}("");
            require(burnOk, "burn failed");
        }

        if (toPower != 0) {
            if (address(vault) == address(0)) revert VaultNotSet();
            // TODO(placeholder): `depositFor` does not exist yet. The vault is
            // an interface with no implementation anywhere in this repo.
            vault.depositFor{value: toPower}(msg.sender);
        }

        emit FeeSplit(epoch, burned, toPower);
    }

    // ---------------------------------------------------------------------
    // Epoch control
    // ---------------------------------------------------------------------

    /// @notice Close the current epoch and open the next one.
    /// @dev    TODO(placeholder): the retarget is a stub. `PowMath.retarget`
    ///         has the intended signature and no arithmetic behind it, so the
    ///         difficulty handed back is whatever the stub decides.
    function advanceEpoch() external onlyOwner {
        uint256 next = PowMath.retarget(difficulty, epoch);

        epoch += 1;
        difficulty = next;

        emit EpochAdvanced(epoch, next);
    }

    /// @notice Override the difficulty directly. Escape hatch while the
    ///         retarget is unimplemented.
    function setDifficulty(uint256 difficulty_) external onlyOwner {
        difficulty = difficulty_;
        emit DifficultySet(difficulty_);
    }

    /// @notice Point the protocol at an energy vault.
    function setVault(IEnergyVault vault_) external onlyOwner {
        if (address(vault_) == address(0)) revert ZeroAddress();
        vault = vault_;
        emit VaultSet(address(vault_));
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    /// @notice Everything a miner needs to start working.
    /// @return epoch_       Current epoch.
    /// @return difficulty_  Leading zero bits required.
    /// @return burned_      Cumulative burned.
    /// @return toPower_     Cumulative forwarded to the vault.
    function miningState()
        external
        view
        returns (uint256 epoch_, uint256 difficulty_, uint256 burned_, uint256 toPower_)
    {
        return (epoch, difficulty, totalBurned, totalToPower);
    }

    /// @notice Check a digest without settling it.
    /// @dev    Inherits the placeholder from `PowMath.meetsTarget`, so this
    ///         returns `true` for everything. Do not read it as a verdict.
    function checkWork(bytes32 digest) external view returns (bool) {
        return PowMath.meetsTarget(digest, difficulty);
    }

    /// @notice True once `digest` has been settled.
    function isSettled(bytes32 digest) external view returns (bool) {
        return settled[digest];
    }

    // ---------------------------------------------------------------------
    // Notes
    // ---------------------------------------------------------------------
    //
    // There is no `mint`. There is no `burn` either, in the token sense - the
    // burn half leaves as value, not as supply, because there is no supply to
    // speak of yet. If a token is ever added, the invariant to preserve is the
    // one stated at the top of this file: no code path creates it.
    //
    // Deliberately absent, and worth noticing:
    //   - no `receive()` / `fallback()`, so stray value is rejected;
    //   - no upgrade proxy, so the rules cannot be swapped after the fact;
    //   - no pause, so nobody can halt settlement.
    //
    // Those three omissions are the design. They are also the reason this
    // contract cannot be fixed in place if the placeholder check ships by
    // accident, which is a good argument for not deploying it at all.
}
