require("dotenv").config();
const { task } = require("hardhat/config");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },  networks: {
    mainnet: {
      url: process.env.MAINNET_URL || `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 64 ? [`0x${process.env.PRIVATE_KEY}`] : [],
      gasLimit: process.env.GAS_LIMIT || 8000000,
      gasPrice: process.env.GAS_PRICE ? parseInt(process.env.GAS_PRICE) * 1000000000 : 20000000000, // 20 gwei
    },
    sepolia: {
      url: process.env.SEPOLIA_URL || `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 64 ? [`0x${process.env.PRIVATE_KEY}`] : [],
      gasLimit: process.env.GAS_LIMIT || 8000000,
    },
    goerli: {
      url: process.env.GOERLI_URL || `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 64 ? [`0x${process.env.PRIVATE_KEY}`] : [],
      gasLimit: process.env.GAS_LIMIT || 8000000,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  },paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  mocha: {
    timeout: process.env.TIMEOUT || 20000
  }
};