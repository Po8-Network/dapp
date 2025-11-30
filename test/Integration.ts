import { expect } from "chai";
import { ethers } from "hardhat";
import axios from "axios";

// This test suite interacts with a running Po8 Node at localhost:8833
// It validates the network availability and basic RPC methods.
// Run with: npx hardhat test --network po8

describe("Po8 Network Integration", function () {
  const NODE_URL = "http://127.0.0.1:8833/rpc";

  // Check if node is running before running tests
  let isNodeRunning = false;
  
  before(async function () {
    try {
        await axios.post(NODE_URL, {
            jsonrpc: "2.0",
            method: "net_version",
            params: [],
            id: 1
        });
        isNodeRunning = true;
    } catch (e) {
        console.log("Po8 Node not detected at " + NODE_URL + ". Skipping integration tests.");
    }
  });

  it("Should return correct Chain ID", async function () {
    if (!isNodeRunning) this.skip();

    const response = await axios.post(NODE_URL, {
        jsonrpc: "2.0",
        method: "net_version",
        params: [],
        id: 1
    });

    // 8 for Mainnet, 80001 for Testnet, 1337 for Dev
    expect([8, 80001, 1337]).to.include(response.data.result);
  });

  it("Should support eth_blockNumber", async function () {
    if (!isNodeRunning) this.skip();

    const response = await axios.post(NODE_URL, {
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1
    });

    expect(response.data.result).to.be.a('number');
  });

  it("Should support eth_getBalance", async function () {
    if (!isNodeRunning) this.skip();

    const response = await axios.post(NODE_URL, {
        jsonrpc: "2.0",
        method: "eth_getBalance",
        params: ["0x0000000000000000000000000000000000000000"],
        id: 1
    });

    expect(response.data.result).to.match(/^0x/);
  });
  
  it("Should support custom method get_mining_stats", async function () {
    if (!isNodeRunning) this.skip();

    const response = await axios.post(NODE_URL, {
        jsonrpc: "2.0",
        method: "get_mining_stats",
        params: [],
        id: 1
    });

    expect(response.data.result).to.have.property("hash_rate");
    expect(response.data.result).to.have.property("is_mining");
  });
});

