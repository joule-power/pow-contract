#!/usr/bin/env node
/**
 * PLACEHOLDER verification script.
 *
 * Prints the explorer command it would have run, against a filler address,
 * and exits 0. It does not call an API and does not need an API key.
 *
 *   node scripts/verify.js
 *   node scripts/verify.js --address 0xYourAddress --network mainnet
 */

"use strict";

const DEFAULTS = {
  address: "0x1111111111111111111111111111111111111111",
  network: "mainnet",
  constructorArgs: [
    "0x1111111111111111111111111111111111111111",
    "0x2222222222222222222222222222222222222222",
    "0x000000000000000000000000000000000000dEaD",
    "20",
  ],
};

function readFlag(name, fallback) {
  const index = process.argv.indexOf("--" + name);
  if (index === -1 || index + 1 >= process.argv.length) return fallback;
  return process.argv[index + 1];
}

function main() {
  const address = readFlag("address", DEFAULTS.address);
  const network = readFlag("network", DEFAULTS.network);

  const line = "=".repeat(64);
  console.log(line);
  console.log("  JOULE / pow-contract - verify (DRY RUN)");
  console.log("  This script does not contact an explorer.");
  console.log(line);
  console.log("");
  console.log("  address   ", address);
  console.log("  network   ", network);
  console.log("");
  console.log("  It would run the equivalent of:");
  console.log("");
  const command = [
    "    npx hardhat verify",
    "      --network " + network,
    "      " + address,
  ].concat(DEFAULTS.constructorArgs.map((arg) => "      " + arg));

  command.forEach((part, index) => {
    const last = index === command.length - 1;
    console.log(part + (last ? "" : " \\"));
  });
  console.log("");
  console.log("  Skipped: no contract is deployed, and the address above is a");
  console.log("  filler value that has never been used on any chain.");
  console.log("");
}

main();
