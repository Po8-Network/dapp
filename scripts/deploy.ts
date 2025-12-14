import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const QuantumBridge = await ethers.getContractFactory("QuantumBridge");
  const bridge = await QuantumBridge.deploy();

  await bridge.waitForDeployment();

  console.log("QuantumBridge deployed to:", await bridge.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
