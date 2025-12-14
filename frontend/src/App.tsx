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
        // Use standard Ethers provider now that Node supports eth_getBalance
        const provider = new ethers.BrowserProvider(window.ethereum);
        const bal = await provider.getBalance(address);
        setBalance(ethers.formatEther(bal));
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
        <h3>Quantum Bridge</h3>
        
        <div style={{ marginBottom: '10px' }}>
            <label style={{display:'block', marginBottom:'5px', fontSize:'12px'}}>Bridge Contract Address</label>
            <input 
                style={{width:'100%', padding:'8px'}} 
                placeholder="0x..." 
                id="bridgeAddr" 
            />
        </div>

        <div style={{ marginBottom: '10px' }}>
            <label style={{display:'block', marginBottom:'5px', fontSize:'12px'}}>Destination Chain</label>
            <input 
                style={{width:'100%', padding:'8px'}} 
                placeholder="e.g. Ethereum" 
                id="destChain" 
            />
        </div>

        <div style={{ marginBottom: '10px' }}>
            <label style={{display:'block', marginBottom:'5px', fontSize:'12px'}}>Destination Address</label>
            <input 
                style={{width:'100%', padding:'8px'}} 
                placeholder="0x..." 
                id="destAddr" 
            />
        </div>

        <div style={{ marginBottom: '10px' }}>
            <label style={{display:'block', marginBottom:'5px', fontSize:'12px'}}>Amount (PO8)</label>
            <input 
                style={{width:'100%', padding:'8px'}} 
                placeholder="0.0" 
                type="number"
                id="amount" 
            />
        </div>

        <button 
            onClick={async () => {
                const bridgeAddr = (document.getElementById('bridgeAddr') as HTMLInputElement).value;
                const destChain = (document.getElementById('destChain') as HTMLInputElement).value;
                const destAddr = (document.getElementById('destAddr') as HTMLInputElement).value;
                const amount = (document.getElementById('amount') as HTMLInputElement).value;

                if (!bridgeAddr || !destChain || !destAddr || !amount) {
                    setStatus("Please fill all fields");
                    return;
                }

                try {
                    setStatus("Locking funds...");
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const signer = await provider.getSigner();
                    
                    const bridgeAbi = [
                        "function lock(string destinationChain, string destinationAddress) external payable"
                    ];
                    
                    const contract = new ethers.Contract(bridgeAddr, bridgeAbi, signer);
                    const tx = await contract.lock(destChain, destAddr, { value: ethers.parseEther(amount) });
                    setStatus("Transaction sent: " + tx.hash);
                    await tx.wait();
                    setStatus("Funds Locked Successfully!");
                    fetchBalance(await signer.getAddress());
                } catch (e: any) {
                    setStatus("Error: " + (e.reason || e.message));
                }
            }}
            style={{ padding: '10px 20px', fontSize: '16px', width: '100%', background: '#38bdf8', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
            Lock Funds
        </button>
      </div>
    </div>
  );
}

export default App;
