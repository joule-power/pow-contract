#!/usr/bin/env node
/**
 * PLACEHOLDER deployment script.
 *
 * This script does not deploy anything. It prints the plan it would follow,
 * with filler addresses, and exits 0. Nothing is broadcast, no key is read,
 * and no network is contacted.
 *
 * It exists so the deploy step has a name and a shape. When the contract is
 * real, the body of `main` below is where the broadcast goes.
 *
 *   node scripts/deploy.js
 *   node scripts/deploy.js --json
 */

"use strict";

// Filler values. None of these are real accounts, and none of them should
// ever receive funds. Replace all four before any real deployment.
const PLAN = {
  contract: "JoulePow",
  constructorArgs: {
    owner: "0x1111111111111111111111111111111111111111",
    treasury: "0x2222222222222222222222222222222222222222",
    burnSink: "0x000000000000000000000000000000000000dEaD",
    difficulty: 20,
  },
  network: "<not configured>",
  estimatedGas: 1_450_000,
  note: "DRY RUN - nothing was broadcast",
};

function banner() {
  const line = "=".repeat(64);
  console.log(line);
  console.log("  JOULE / pow-contract - deploy (DRY RUN)");
  console.log("  This script does not deploy anything.");
  console.log(line);
}

function main() {
  const asJson = process.argv.includes("--json");

  if (asJson) {
    console.log(JSON.stringify(PLAN, null, 2));
    return;
  }

  banner();
  console.log("");
  console.log("  contract        ", PLAN.contract);
  console.log("  network         ", PLAN.network);
  console.log("  estimated gas   ", PLAN.estimatedGas.toLocaleString("en-US"));
  console.log("");
  console.log("  constructor arguments");
  for (const [key, value] of Object.entries(PLAN.constructorArgs)) {
    console.log("    " + key.padEnd(12), value);
  }
  console.log("");
  console.log("  Every address above is a filler value.");
  console.log("  The proof-of-work check in PowMath is a stub, so a deployment");
  console.log("  of this code would accept any nonce from anyone.");
  console.log("");
  console.log("  " + PLAN.note);
  console.log("");
}

main();
