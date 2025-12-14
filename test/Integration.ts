import { expect } from "chai";
import { ethers } from "hardhat";
import axios from "axios";
// @ts-ignore
import mldsa from "mldsa-wasm";

describe("Po8 Network Integration", function () {
  const NODE_URL = "http://127.0.0.1:8833/rpc";
  let isNodeRunning = false;
  let signer: any;
  let bridge: any;
  
  // Quantum Keys
  let q_pk: Uint8Array;
  let q_sk: Uint8Array;

  before(async function () {
    // 1. Check Node
    try {
        await axios.post(NODE_URL, { jsonrpc: "2.0", method: "net_version", params: [], id: 1 });
        isNodeRunning = true;
    } catch (e) {
        console.log("Po8 Node not detected. Skipping tests.");
        return;
    }

    // 2. Setup Signer & Fund it
    const [deployer] = await ethers.getSigners();
    signer = deployer;
    const address = await signer.getAddress();
    
    console.log("Testing with address:", address);

    // Fund via Faucet (Only works in Dev Mode)
    try {
        await axios.post(NODE_URL, {
            jsonrpc: "2.0",
            method: "faucet",
            params: [address, "10000000000000000000"], // 10 PO8
            id: 2
        });
        // Wait a bit for balance to reflect (atomic write in node)
        await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
        console.warn("Faucet failed (maybe not in dev mode?)");
    }

    // 3. Generate Quantum Keypair for Bridge Authority
    const kp = await mldsa.generateKey("ML-DSA-65", true, ["sign", "verify"]);
    const pkRaw = await mldsa.exportKey("raw-public", kp.publicKey);
    const skRaw = await mldsa.exportKey("raw-seed", kp.privateKey);
    q_pk = new Uint8Array(pkRaw);
    q_sk = new Uint8Array(skRaw);
    console.log("Generated Quantum Authority Key");
  });

  it("Should deploy QuantumBridge", async function () {
    if (!isNodeRunning) this.skip();

    const Bridge = await ethers.getContractFactory("QuantumBridge");
    bridge = await Bridge.deploy();
    await bridge.waitForDeployment();

    expect(await bridge.getAddress()).to.properAddress;
    console.log("Bridge deployed at:", await bridge.getAddress());
  });

  it("Should lock funds", async function () {
    if (!isNodeRunning || !bridge) this.skip();

    const amount = ethers.parseEther("1.0");
    const tx = await bridge.lock("Ethereum", "0xTargetAddress", { value: amount });
    await tx.wait();

    // Check Balance of Contract
    const balance = await ethers.provider.getBalance(await bridge.getAddress());
    expect(balance).to.equal(amount);
  });

  it("Should allow quantum unlock via precompile", async function () {
    if (!isNodeRunning || !bridge) this.skip();

    const recipient = await signer.getAddress();
    const amount = ethers.parseEther("0.1");
    const nonce = ethers.randomBytes(32);
    
    // Construct Message Hash
    // keccak256(recipient, amount, nonce, address(this), chainId)
    const chainId = 1337; // Devnet
    const bridgeAddr = await bridge.getAddress();
    
    const abiCoder = new ethers.AbiCoder();
    const encoded = abiCoder.encode(
        ["address", "uint256", "bytes32", "address", "uint256"],
        [recipient, amount, nonce, bridgeAddr, chainId]
    );
    // Keccak256 hash of the packed arguments (Solidity abi.encodePacked is slightly different, but let's match solidity)
    // Solidity: abi.encodePacked(recipient, amount, nonce, address(this), block.chainid)
    // Ethers: solidityPacked
    const hash = ethers.solidityPackedKeccak256(
        ["address", "uint256", "bytes32", "address", "uint256"],
        [recipient, amount, nonce, bridgeAddr, chainId]
    );
    
    // Convert hex hash to Uint8Array
    const hashBytes = ethers.getBytes(hash);

    // Sign with ML-DSA
    const importSk = await mldsa.importKey("raw-seed", q_sk, "ML-DSA-65", true, ["sign"]);
    const sigRaw = await mldsa.sign("ML-DSA-65", importSk, hashBytes);
    const signature = new Uint8Array(sigRaw);

    // Execute Unlock
    // Arguments: recipient, amount, nonce, signature, signerPublicKey
    const tx = await bridge.unlock(
        recipient, 
        amount, 
        nonce, 
        signature, 
        q_pk
    );
    await tx.wait();

    console.log("Quantum Unlock Successful!");
  });

  it("Should allow admin unlock", async function () {
    if (!isNodeRunning || !bridge) this.skip();

    const recipient = await signer.getAddress();
    const amount = ethers.parseEther("0.5");
    const nonce = ethers.randomBytes(32);

    const balanceBefore = await ethers.provider.getBalance(recipient);

    const tx = await bridge.adminUnlock(recipient, amount, nonce);
    await tx.wait();

    const balanceAfter = await ethers.provider.getBalance(recipient);
    expect(balanceAfter).to.be.gt(balanceBefore);
  });

  // RPC Tests
  it("Should return correct Chain ID", async function () {
    if (!isNodeRunning) this.skip();
    const response = await axios.post(NODE_URL, { jsonrpc: "2.0", method: "eth_chainId", params: [], id: 1 });
    expect(parseInt(response.data.result, 16)).to.equal(1337);
  });
});
