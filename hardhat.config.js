/**
 * PLACEHOLDER Hardhat configuration.
 *
 * There are no networks configured and no compiler settings pinned, because
 * no chain has been chosen and the contract does not compile yet. The file
 * exists so `npx hardhat` has something to read.
 *
 * If you are adding a network: put the URL and the key in `.env` (see
 * `.env.example`), read them here, and never commit the values.
 */

"use strict";

require("dotenv").config();

/** @type {import("hardhat/config").HardhatUserConfig} */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  // No networks are configured on purpose. Add them here when there is a
  // contract worth deploying and a chain to deploy it to.
  //
  //   networks: {
  //     example: {
  //       url: process.env.RPC_URL || "",
  //       accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
  //     },
  //   },
  networks: {},

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  mocha: {
    timeout: 40000,
  },
};
