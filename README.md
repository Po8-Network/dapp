# Po8 Smart Contracts (dApp)

Solidity smart contracts and frontend interfaces for the Po8 Network ecosystem.

## Contracts

*   **`QAL_Account.sol`**: Account Abstraction logic for Quantum Accounts (if moved on-chain).
*   **`QuantumBridge.sol`**: Logic for bridging assets to/from legacy EVM chains.

## Development

This project uses Hardhat for contract development and Vite/React for the frontend.

### Contracts
```bash
npm install
npx hardhat compile
npx hardhat test
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

