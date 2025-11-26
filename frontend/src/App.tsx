import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Add type for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
    po8?: any;
  }
}

function App() {
  const [balance, setBalance] = useState('0');
  const [account, setAccount] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          fetchBalance(accounts[0]);
        }
      } catch (err) {
        console.error("Connection check failed", err);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setStatus("Po8 Wallet extension not found!");
      return;
    }

    try {
      setStatus("Connecting...");
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      setStatus("Connected");
      fetchBalance(accounts[0]);
    } catch (err: any) {
      setStatus("Connection failed: " + err.message);
    }
  };

  const fetchBalance = async (address: string) => {
    if (!window.ethereum) return;
    // We can use the provider to get balance, or standard RPC
    // Po8 Node supports 'get_balance' via JSON-RPC, but Ethers uses 'eth_getBalance'
    // Our Node currently has 'get_balance' custom method, but we should probably add 'eth_getBalance' alias in Node 
    // OR we can use the custom method via request.
    
    // Attempt standard eth_getBalance (if Node supports it, which we should add)
    // Or use the custom 'get_balance' for now if we know we are on Po8.
    try {
        // Using low-level request for custom method if needed, or standard if aligned.
        // Let's assume we want to align to standard, but for now we might fallback.
        
        // Ethers provider wrapper
        // const provider = new ethers.BrowserProvider(window.ethereum);
        // const bal = await provider.getBalance(address);
        
        // Direct request to support our custom node for now
        const bal = await window.ethereum.request({ 
            method: 'get_balance', 
            params: [address] 
        });
        setBalance(bal);
    } catch (err) {
        console.error("Fetch balance failed", err);
    }
  };

  return (
    <div className="App" style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Po8 Quantum Bridge Dapp</h1>
      
      <div style={{ marginBottom: '20px' }}>
        {!account ? (
          <button onClick={connectWallet} style={{ padding: '10px 20px', fontSize: '16px' }}>
            Connect Po8 Wallet
          </button>
        ) : (
          <div>
            <p><strong>Connected:</strong> {account}</p>
            <p><strong>Balance:</strong> {balance} PO8</p>
          </div>
        )}
      </div>

      {status && <p style={{ color: 'orange' }}>{status}</p>}

      <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', maxWidth: '400px' }}>
        <h3>Smart Contract Interaction</h3>
        <p>Deploy contracts using Hardhat, then interact here.</p>
        {/* Placeholder for future interactions */}
      </div>
    </div>
  );
}

export default App;
