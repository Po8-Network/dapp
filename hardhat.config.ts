import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  networks: {
    po8: {
      url: "http://localhost:8545",
      chainId: 3333, // Example Chain ID
    }
  }
};

export default config;

