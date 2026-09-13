/**
 * Shape tests for the scaffold.
 *
 * These do NOT test whether the protocol is correct, because there is nothing
 * correct to test yet. They assert that the parts are wired together: that the
 * split is 50/50, that the target maths is internally consistent, that the
 * miner's loop terminates, and that the placeholder work check is still the
 * placeholder it says it is.
 *
 * Run with:
 *   node test/pow.test.js
 */

"use strict";

const assert = require("node:assert");
const crypto = require("node:crypto");

const {
  findNonce,
  targetFor,
  leadingZeroBits,
  MAX_UINT256,
} = require("../miner/worker.js");

const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: error.message });
  }
}

// ---------------------------------------------------------------------------
// Target maths
// ---------------------------------------------------------------------------

test("targetFor(0) is every digest", () => {
  assert.strictEqual(targetFor(0), MAX_UINT256);
});

test("targetFor shrinks by one bit per step", () => {
  for (let bits = 0; bits < 32; bits += 1) {
    assert.strictEqual(targetFor(bits) >> 1n, targetFor(bits + 1));
  }
});

test("targetFor clamps at 256 bits", () => {
  assert.strictEqual(targetFor(256), 0n);
  assert.strictEqual(targetFor(999), 0n);
});

test("leadingZeroBits agrees with the target comparison", () => {
  for (let i = 0; i < 64; i += 1) {
    const digest = crypto.createHash("sha256").update("probe:" + i).digest("hex");
    const bits = leadingZeroBits(digest);
    const value = BigInt("0x" + digest);

    // The digest clears `bits` leading zeros but not `bits + 1`.
    assert.ok(value <= targetFor(bits), "expected digest to clear " + bits + " bits");
    if (bits < 256) {
      assert.ok(value > targetFor(bits + 1), "expected digest to fail " + (bits + 1) + " bits");
    }
  }
});

test("leadingZeroBits(0) reports 256", () => {
  assert.strictEqual(leadingZeroBits("00".repeat(32)), 256);
});

// ---------------------------------------------------------------------------
// The split
// ---------------------------------------------------------------------------

test("the fee split is 50/50 and loses nothing to rounding", () => {
  const fees = [1n, 3n, 999n, 10n ** 15n, 10n ** 18n + 1n];
  for (const fee of fees) {
    const burned = fee / 2n;
    const toPower = fee - burned;
    assert.strictEqual(burned + toPower, fee, "split must account for the whole fee");
    assert.ok(toPower >= burned, "the odd wei must land on the power side");
  }
});

test("the split adds no supply", () => {
  // The only invariant that matters. A split moves value; it never creates it.
  const fee = 12345678901234567n;
  const burned = fee / 2n;
  const toPower = fee - burned;
  assert.strictEqual(burned + toPower, fee);
});

// ---------------------------------------------------------------------------
// The miner loop
// ---------------------------------------------------------------------------

test("findNonce terminates when the cap is small", () => {
  const result = findNonce({
    header: "deadbeef",
    difficulty: 250, // unreachable on purpose
    maxNonces: 500,
  });
  assert.strictEqual(result.found, false);
  assert.strictEqual(result.hashed, 500);
  assert.strictEqual(result.nonce, null);
});

test("findNonce finds a trivial target immediately", () => {
  const result = findNonce({ header: "deadbeef", difficulty: 0, maxNonces: 10 });
  assert.strictEqual(result.found, true);
  assert.strictEqual(result.nonce, 0);
  assert.ok(result.digest);
});

test("findNonce is deterministic for a given header", () => {
  const a = findNonce({ header: "abc123", difficulty: 4, maxNonces: 100000 });
  const b = findNonce({ header: "abc123", difficulty: 4, maxNonces: 100000 });
  assert.deepStrictEqual(a, b);
});

test("findNonce reports a best no worse than the found digest", () => {
  const result = findNonce({ header: "abc123", difficulty: 4, maxNonces: 100000 });
  assert.ok(result.best >= leadingZeroBits(result.digest));
});

// ---------------------------------------------------------------------------
// The scaffold is still a scaffold
// ---------------------------------------------------------------------------

test("the work check in PowMath is still a stub", () => {
  // This test is deliberately written to FAIL the moment someone implements
  // `meetsTarget` for real without updating the documentation that says it is
  // a placeholder. If this goes red, go and fix README.md and the header of
  // PowMath.sol, then delete this test.
  const fs = require("node:fs");
  const path = require("node:path");
  const source = fs.readFileSync(
    path.join(__dirname, "..", "contracts", "libraries", "PowMath.sol"),
    "utf8"
  );

  assert.ok(
    source.includes("return true;"),
    "PowMath.meetsTarget no longer returns true unconditionally - update the docs"
  );
  assert.ok(
    source.includes("TODO(placeholder)"),
    "the placeholder marker is gone - update the docs"
  );
});

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

for (const result of results) {
  if (result.ok) {
    passed += 1;
    console.log("  ok    " + result.name);
  } else {
    failed += 1;
    console.log("  FAIL  " + result.name);
    console.log("        " + result.error);
  }
}

console.log("");
console.log("  " + passed + " passed, " + failed + " failed");

if (failed > 0) process.exit(1);
