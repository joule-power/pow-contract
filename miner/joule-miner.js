#!/usr/bin/env node
/**
 * PLACEHOLDER reference miner for JOULE.
 *
 * Runs the real loop shape - pick a header, walk nonces, compare against the
 * epoch target, "settle" on a hit - and prints simulated settlement lines.
 *
 * It is a SIMULATION and every line it prints is prefixed `[sim]`:
 *   - sha256 stands in for a hash function that has not been chosen;
 *   - there is no node, so nothing is submitted and nothing is settled;
 *   - the difficulty retarget, the fee, the burn and the vault split are all
 *     generated numbers. They do not correspond to anything on any chain.
 *
 * It is here to pin down the interface: what a miner needs to read from the
 * contract (`epoch`, `difficulty`, `submitWork`) and what it hands back
 * (`digest`, `nonce`).
 *
 *   node miner/joule-miner.js
 *   node miner/joule-miner.js --config miner/config.example.json
 *   node miner/joule-miner.js --rounds 0          # run until interrupted
 */

"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const { findNonce, leadingZeroBits } = require("./worker.js");

const DEFAULTS = {
  label: "reference-miner",
  difficulty: 16,
  maxNonces: 3_000_000,
  rounds: 5,
  feeWei: "1000000000000000",
  retargetEvery: 3,
  account: "0x0000000000000000000000000000000000000000",
};

function readFlag(name, fallback) {
  const index = process.argv.indexOf("--" + name);
  if (index === -1 || index + 1 >= process.argv.length) return fallback;
  const raw = process.argv[index + 1];
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : raw;
}

function loadConfig() {
  const index = process.argv.indexOf("--config");
  if (index === -1 || index + 1 >= process.argv.length) return { ...DEFAULTS };

  const file = path.resolve(process.cwd(), process.argv[index + 1]);
  if (!fs.existsSync(file)) {
    console.log("  [sim] config not found at " + file + " - using defaults");
    return { ...DEFAULTS };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return { ...DEFAULTS, ...parsed };
  } catch (error) {
    console.log("  [sim] config unreadable (" + error.message + ") - using defaults");
    return { ...DEFAULTS };
  }
}

function formatEth(wei) {
  const value = BigInt(wei);
  const whole = value / 1_000_000_000_000_000_000n;
  const frac = (value % 1_000_000_000_000_000_000n)
    .toString()
    .padStart(18, "0")
    .slice(0, 6)
    .replace(/0+$/, "");
  return whole.toString() + (frac ? "." + frac : "");
}

function main() {
  const config = loadConfig();
  const rounds = Number(readFlag("rounds", config.rounds));
  const infinite = rounds === 0;

  const line = "=".repeat(64);
  console.log(line);
  console.log("  JOULE / pow-contract - reference miner (SIMULATION)");
  console.log("  Every line below is generated. Nothing is submitted.");
  console.log(line);
  console.log("");
  console.log("  label       ", config.label);
  console.log("  account     ", config.account);
  console.log("  difficulty  ", config.difficulty, "leading zero bits");
  console.log("  fee         ", formatEth(config.feeWei), "ETH per settled block");
  console.log("  rounds      ", infinite ? "unbounded (Ctrl+C to stop)" : rounds);
  console.log("");

  let epoch = 1;
  let difficulty = Number(config.difficulty);
  let burned = 0n;
  let toPower = 0n;
  let settled = 0;

  for (let round = 1; infinite || round <= rounds; round += 1) {
    // A real header commits to the epoch, the previous digest and the
    // receiving account. That commitment is not designed yet.
    const header = crypto
      .createHash("sha256")
      .update("joule.pow.placeholder.header:" + epoch + ":" + settled)
      .digest("hex");

    console.log("  epoch " + epoch + "  target difficulty " + difficulty);

    const started = Date.now();
    const result = findNonce({
      header,
      difficulty,
      maxNonces: Number(config.maxNonces),
      onProgress: ({ hashed, best }) => {
        console.log(
          "    [sim] " +
            hashed.toLocaleString("en-US").padStart(12) +
            " hashed   best " +
            best +
            " bits"
        );
      },
    });
    const elapsed = ((Date.now() - started) / 1000).toFixed(2);

    if (!result.found) {
      console.log(
        "    [sim] no hit inside " +
          Number(config.maxNonces).toLocaleString("en-US") +
          " nonces (best " +
          result.best +
          " bits, " +
          elapsed +
          "s)"
      );
      console.log("");
      continue;
    }

    // The 50/50 split, computed locally because there is no contract.
    const fee = BigInt(config.feeWei);
    const halfBurned = fee / 2n;
    const halfToPower = fee - halfBurned;
    burned += halfBurned;
    toPower += halfToPower;
    settled += 1;

    console.log(
      "    [sim] hit after " +
        result.hashed.toLocaleString("en-US") +
        " nonces in " +
        elapsed +
        "s"
    );
    console.log("    [sim] nonce   " + result.nonce);
    console.log("    [sim] digest  0x" + result.digest);
    console.log("    [sim] bits    " + leadingZeroBits(result.digest));
    console.log("    [sim] settle  would call submitWork(digest, nonce)");
    console.log("    [sim] split   " + formatEth(halfBurned) + " ETH burned");
    console.log("    [sim] split   " + formatEth(halfToPower) + " ETH to power");
    console.log("");

    if (settled % Number(config.retargetEvery) === 0) {
      epoch += 1;
      // Cosmetic. `PowMath.retarget` is a stub, so this is not the rule.
      difficulty += result.hashed < 200000 ? 1 : -1;
      if (difficulty < 8) difficulty = 8;
      console.log(
        "  epoch " +
          epoch +
          "  difficulty " +
          difficulty +
          "  (retarget is a stub - this step is cosmetic)"
      );
      console.log("");
    }
  }

  console.log(line);
  console.log("  totals (simulated)");
  console.log("    blocks settled   " + settled);
  console.log("    burned           " + formatEth(burned) + " ETH");
  console.log("    to power         " + formatEth(toPower) + " ETH");
  console.log("    supply added     0");
  console.log("");
  console.log("  Nothing above happened. See README.md.");
  console.log(line);
}

main();
