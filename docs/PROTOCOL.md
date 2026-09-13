# JOULE - protocol notes

> **PLACEHOLDER.** These are the rules as intended, written down so the code has
> something to be wrong about. Several of them are not implemented, and the one
> that matters most - the work check - is a stub. See the checklist at the end.

---

## 1. The problem with paying miners in the coin

A proof-of-work chain has to pay for its own security. The conventional way is
to pay the people providing it in the coin they are securing.

That is circular. The payment *is* new supply. Every block that makes the chain
harder to attack also makes the coin less scarce, and the only thing holding
the two in balance is the market's willingness to absorb the new coins. When
that willingness dips, the reward is worth less, miners leave, and the security
budget falls with them. The mechanism that pays for security is the mechanism
that erodes it.

## 2. What JOULE does instead

The mining agent is paid in something the protocol has to go out and buy:
**energy-sector equity**, acquired at the moment a block is proven.

The miner never receives JOULE. The miner receives a claim on equity that JOULE
bought with the miner's half of the fee. That inverts the loop. New blocks do
not create new supply, so the security budget and the scarcity of the coin are
no longer pulling against each other.

## 3. The split

Every settled block splits its fee exactly in half.

| Half | Destination | Effect |
| --- | --- | --- |
| 50% | burn sink | deleted. The value leaves the system. |
| 50% | energy vault | converted into equity, held for the miner. |

Neither half returns to the protocol. There is no third destination and no
retained cut.

### Why the burn half is not optional

Without it, the protocol would be a pure pass-through: fees in, equity out, and
nothing about the coin itself gets tighter. The burn is what ties block
production to scarcity. It is the half that makes the other half mean anything.

## 4. Supply only goes one way

> **There is no mint function.**

This is the load-bearing property. Not "minting is capped", not "minting is
disabled by the owner", not "minting requires a governance vote" - there is no
code path that creates supply. Every write in `JoulePow` either moves an
existing balance or records a burn.

Consequences worth stating plainly:

- **The supply curve is monotonic and downward.** No epoch, no difficulty, no
  owner action can bend it back up.
- **Governance cannot inflate.** The strongest thing a governance vote could do
  is change who receives the power half, not how much of it exists.
- **The burn is irreversible by construction.** A future version of the
  protocol cannot undo it, because undoing it would require a mint.

If a token is ever added, this is the property to preserve, and the test for it
is a search: grep the codebase for anything that increases a balance without a
matching decrease somewhere else.

## 5. Epochs and difficulty

- A **block** is one accepted `submitWork` call.
- An **epoch** is `RETARGET_INTERVAL` blocks - 100 as currently written.
- Difficulty is expressed in **leading zero bits**, not as a decimal number.

Leading zero bits rather than a decimal target because the rule then survives a
change of hash function. A digest either has the zeros or it does not, and that
statement does not depend on which function produced it.

### Retargeting

At the end of an epoch, difficulty steps by whole bits to bring the observed
block time back toward `TARGET_BLOCK_SECONDS`.

```
observed = seconds the epoch actually took
expected = TARGET_BLOCK_SECONDS * RETARGET_INTERVAL
next     = difficulty + log2(expected / observed)
```

Whole-bit steps, not multipliers. That is coarse, and the coarseness is the
point: a step function is far harder to exploit by grinding block timestamps
than a smooth adjustment, because there is no fractional gain to be had from
shaving a second off a timestamp. The clamp bounds any single retarget to a few
bits either way.

**Status: not implemented.** `PowMath.retarget` returns its input.

## 6. Replay protection

A digest may be settled once. `settled[digest]` enforces this.

**Open question, and it is a real one:** should that be per epoch rather than
forever? As written, work found in epoch N can never be resubmitted in epoch
N+1, even though the header it commits to has changed. Scoping the guard per
epoch is almost certainly correct, and it changes the miner's behaviour, so it
should be settled before anything is built on top of it.

## 7. What the miner needs

Three reads, one write.

| Direction | Member | Purpose |
| --- | --- | --- |
| read | `epoch()` | which header to commit to |
| read | `difficulty()` | how many leading zero bits to clear |
| read | `miningState()` | all of the above in one call |
| write | `submitWork(digest, nonce)` | settle a hit |

The header commitment - what exactly goes into the bytes being hashed - is not
designed yet. That is why `miner/worker.js` hashes a filler string: the shape
of the loop is fixed, the contents are not.

## 8. Deliberately absent

These are omissions by design, not gaps:

- **No `receive()` or `fallback()`.** Stray value is rejected rather than
  silently absorbed.
- **No upgrade proxy.** The rules cannot be swapped after the fact. A holder
  can read the contract and know what they hold.
- **No pause.** Nobody can halt settlement.

The cost of that last one is worth naming: if the placeholder work check ever
reached a deployment, the contract could not be paused while it was fixed. That
is a good argument for not deploying it at all.

## 9. Not implemented

- [ ] `PowMath.meetsTarget` - returns `true` for every digest
- [ ] `PowMath.leadingZeroBits` - reverts
- [ ] `PowMath.retarget` - returns its input
- [ ] `IEnergyVault` - no implementation exists
- [ ] the hash function - not chosen
- [ ] the header commitment - not designed
- [ ] fee validation in `submitWork` - the caller chooses what to pay
- [ ] per-epoch replay scoping - see section 6
- [ ] the burn sink - a filler address
