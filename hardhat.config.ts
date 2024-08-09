import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
require('@dotenvx/dotenvx').config()

const config: HardhatUserConfig = {
  networks: process.env.DEPLOYER_KEY ? {
    testnet: {
      url: "https://sepolia.base.org",
      chainId: 84532,
      accounts: [process.env.DEPLOYER_KEY!],
    },
    mainnet: {
      url: "https://mainnet.base.org",
      chainId: 8453,
      accounts: [process.env.DEPLOYER_KEY]
    }
  } : {},
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  etherscan: {
    apiKey: {
      baseSepolia: process.env.ETHERSCAN_API_KEY!
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS != 'false',
    currency: 'EUR',
    gasPrice: 1,

    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  }
};

export default config;
