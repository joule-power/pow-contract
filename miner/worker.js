/**
 * The inner nonce loop.
 *
 * This is the part of the miner that is actually shaped like a miner: hash a
 * header with a counter appended, compare the digest against the epoch target,
 * stop on a hit. Everything around it is scaffolding.
 *
 * It is a SIMULATION:
 *   - sha256 stands in for a hash function that has not been chosen;
 *   - there is no node, so a hit is returned to the caller and not submitted;
 *   - the "best leading zero bits" figure is a diagnostic, not a score.
 *
 * Exported so `scripts/mine-once.js` and `miner/joule-miner.js` share one
 * implementation of the loop rather than two that drift apart.
 */

"use strict";

const crypto = require("node:crypto");

const MAX_UINT256 = (1n << 256n) - 1n;

/**
 * Highest digest that clears `difficulty` leading zero bits.
 * Mirrors `PowMath.targetFor` on the contract side.
 */
function targetFor(difficulty) {
  if (difficulty >= 256) return 0n;
  return MAX_UINT256 >> BigInt(difficulty);
}

/**
 * Count leading zero bits in a hex digest.
 */
function leadingZeroBits(digestHex) {
  const clean = digestHex.startsWith("0x") ? digestHex.slice(2) : digestHex;
  const wide = BigInt("0x" + clean);
  if (wide === 0n) return 256;

  let bits = 0;
  let probe = wide;
  while ((probe & (1n << 255n)) === 0n) {
    bits += 1;
    probe <<= 1n;
  }
  return bits;
}

/**
 * Hash one candidate.
 */
function hashCandidate(header, nonce) {
  return crypto
    .createHash("sha256")
    .update(header)
    .update(":")
    .update(String(nonce))
    .digest("hex");
}

/**
 * Walk nonces until one clears the target, or the cap runs out.
 *
 * @param {object}   options
 * @param {string}   options.header      Hex header, with or without 0x.
 * @param {number}   options.difficulty  Leading zero bits required.
 * @param {number}   options.maxNonces   Give up after this many hashes.
 * @param {number}   [options.startAt]   First nonce to try.
 * @param {Function} [options.onProgress] Called with { hashed, best, nonce }.
 * @returns {{found: boolean, nonce: number|null, digest: string|null,
 *            hashed: number, best: number}}
 */
function findNonce(options) {
  const header = options.header;
  const difficulty = options.difficulty;
  const maxNonces = options.maxNonces;
  const startAt = options.startAt || 0;
  const onProgress = options.onProgress || function () {};

  const target = targetFor(difficulty);
  let best = 0;
  let hashed = 0;

  for (let nonce = startAt; hashed < maxNonces; nonce += 1) {
    const digest = hashCandidate(header, nonce);
    hashed += 1;

    const zeroBits = leadingZeroBits(digest);
    if (zeroBits > best) best = zeroBits;

    if (BigInt("0x" + digest) <= target) {
      return { found: true, nonce, digest, hashed, best };
    }

    if (hashed % 50000 === 0) onProgress({ hashed, best, nonce });
  }

  return { found: false, nonce: null, digest: null, hashed, best };
}

module.exports = { findNonce, targetFor, leadingZeroBits, hashCandidate, MAX_UINT256 };
