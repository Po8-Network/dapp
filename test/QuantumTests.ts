import { expect } from "chai";
import { ethers } from "hardhat";

describe("QuantumBridge", function () {
  it("Should accept deposits", async function () {
    const [owner, otherAccount] = await ethers.getSigners();
    const QuantumBridge = await ethers.getContractFactory("QuantumBridge");
    const bridge = await QuantumBridge.deploy();

    const depositAmount = ethers.utils.parseEther("1.0");
    
    await expect(bridge.connect(owner).deposit({ value: depositAmount }))
      .to.emit(bridge, "Deposit")
      .withArgs(owner.address, depositAmount);

    expect(await bridge.balances(owner.address)).to.equal(depositAmount);
  });

  it("Should allow withdrawals", async function () {
    const [owner] = await ethers.getSigners();
    const QuantumBridge = await ethers.getContractFactory("QuantumBridge");
    const bridge = await QuantumBridge.deploy();

    const depositAmount = ethers.utils.parseEther("1.0");
    await bridge.deposit({ value: depositAmount });

    await expect(bridge.withdraw(depositAmount))
      .to.emit(bridge, "Withdraw")
      .withArgs(owner.address, depositAmount);
      
    expect(await bridge.balances(owner.address)).to.equal(0);
  });
});

describe("QAL_Account", function () {
  it("Should deploy with a public key", async function () {
    const QAL_Account = await ethers.getContractFactory("QAL_Account");
    // Mock 65-byte or whatever size public key
    const mockPublicKey = ethers.utils.hexlify(ethers.utils.randomBytes(65)); // Adjust size as per ML-DSA-65 spec (~2.5KB actually, but contract uses bytes)
    // ML-DSA-65 PK is much larger, around 1312 bytes + logic.
    // The contract just stores bytes.
    
    const account = await QAL_Account.deploy(mockPublicKey);
    expect(await account.publicKey()).to.equal(mockPublicKey);
  });

  // Note: validateUserOp calls 0x21 precompile which is only available in po8-node.
  // Tests for that should be run against a local po8-node or mocked.
});

