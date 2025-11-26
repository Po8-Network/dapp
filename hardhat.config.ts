import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  networks: {
    po8: {
      url: "http://127.0.0.1:8833", // Po8 Node Default Port
      chainId: 1337, // Development Chain ID
    }
  }
};

export default config;

