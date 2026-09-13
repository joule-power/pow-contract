#!/usr/bin/env node
/**
 * One mining attempt, end to end, with no chain involved.
 *
 * Prints a header, a digest, a target comparison and a verdict, then stops.
 * Nothing is submitted anywhere - this is a local demonstration of the loop
 * shape, not a miner.
 *
 *   node scripts/mine-once.js
 *   node scripts/mine-once.js --difficulty 16 --max 200000
 */

"use strict";

const crypto = require("node:crypto");
const { findNonce, targetFor, leadingZeroBits } = require("../miner/worker.js");

function readFlag(name, fallback) {
  const index = process.argv.indexOf("--" + name);
  if (index === -1 || index + 1 >= process.argv.length) return fallback;
  const parsed = Number(process.argv[index + 1]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function main() {
  const difficulty = readFlag("difficulty", 18);
  const maxNonces = readFlag("max", 2_000_000);

  // A filler header. A real one commits to the epoch, the previous digest and
  // the receiving account; the shape of that commitment is not decided yet.
  const header = crypto
    .createHash("sha256")
    .update("joule.pow.placeholder.header")
    .digest("hex");

  console.log("=".repeat(64));
  console.log("  JOULE / pow-contract - mine once (SIMULATION)");
  console.log("  Nothing is submitted. No chain is contacted.");
  console.log("=".repeat(64));
  console.log("");
  console.log("  header      ", "0x" + header);
  console.log("  difficulty  ", difficulty, "leading zero bits");
  console.log("  target      ", "0x" + targetFor(difficulty).toString(16));
  console.log("  nonce cap   ", maxNonces.toLocaleString("en-US"));
  console.log("");

  const started = Date.now();

  const result = findNonce({
    header,
    difficulty,
    maxNonces,
    onProgress: ({ hashed, best }) => {
      if (hashed % 250000 !== 0) return;
      console.log(
        "  [sim] " +
          hashed.toLocaleString("en-US").padStart(12) +
          " hashed   best " +
          best +
          " leading zero bits"
      );
    },
  });

  const elapsed = ((Date.now() - started) / 1000).toFixed(2);

  console.log("");
  if (!result.found) {
    console.log("  no nonce cleared the target inside the cap");
    console.log("  best seen   ", result.best, "leading zero bits");
    console.log("  hashed      ", result.hashed.toLocaleString("en-US"));
    console.log("  elapsed     ", elapsed + "s");
    console.log("");
    console.log("  [sim] That is expected. The difficulty above is set well");
    console.log("  [sim] beyond what this simulation reaches in a cap this size.");
    return;
  }

  console.log("  nonce       ", result.nonce);
  console.log("  digest      ", "0x" + result.digest);
  console.log("  zero bits   ", leadingZeroBits(result.digest));
  console.log("  hashed      ", result.hashed.toLocaleString("en-US"));
  console.log("  elapsed     ", elapsed + "s");
  console.log("");
  console.log("  [sim] A real miner would now call submitWork(digest, nonce).");
  console.log("  [sim] This one does not, because there is nothing to call.");
  console.log("");
}

main();
