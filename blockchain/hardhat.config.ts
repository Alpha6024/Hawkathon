import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import * as dotenv from "dotenv";
dotenv.config();

const ALCHEMY_RPC_URL = process.env.ALCHEMY_RPC_URL || "";
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || "";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  solidity: { version: "0.8.28" },
  networks: {
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
    },
    amoy: {
      type: "http",
      url: ALCHEMY_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
  },
});
