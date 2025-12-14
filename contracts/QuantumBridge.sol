// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract QuantumBridge {
    address public admin;
    mapping(bytes32 => bool) public processedNonces;
    
    // Address of the ML-DSA Verify Precompile (0x21)
    address public constant QAL_PRECOMPILE = address(0x21);

    event Locked(address indexed sender, uint256 amount, string destinationChain, string destinationAddress, uint256 timestamp);
    event Unlocked(address indexed recipient, uint256 amount, bytes32 nonce, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // Lock native PO8 to be bridged elsewhere
    function lock(string calldata destinationChain, string calldata destinationAddress) external payable {
        require(msg.value > 0, "Amount must be > 0");
        emit Locked(msg.sender, msg.value, destinationChain, destinationAddress, block.timestamp);
    }

    // Unlock/Release PO8 to a user on this chain (triggered by bridge relayer/validators)
    // For MVP, we use Admin signature or direct call. 
    // To make it "Quantum", we could require an ML-DSA signature verified by precompile.
    // Let's implement the `unlockWithProof` using the precompile.
    
    function unlock(
        address recipient, 
        uint256 amount, 
        bytes32 nonce,
        bytes calldata signature, // ML-DSA signature
        bytes calldata signerPublicKey // Public key of the bridge authority
    ) external {
        require(!processedNonces[nonce], "Nonce already processed");
        
        // 1. Verify Signature using QAL Precompile
        // Message to sign: keccak256(recipient, amount, nonce, address(this), chainId)
        bytes32 msgHash = keccak256(abi.encodePacked(recipient, amount, nonce, address(this), block.chainid));
        
        // Call Precompile: (bytes publicKey, bytes32 msgHash, bytes signature)
        bytes memory encodedData = abi.encode(signerPublicKey, msgHash, signature);
        (bool success, bytes memory result) = QAL_PRECOMPILE.staticcall(encodedData);
        
        require(success && result.length == 32 && uint256(bytes32(result)) == 1, "Invalid Quantum Proof");

        // 2. Process
        processedNonces[nonce] = true;
        payable(recipient).transfer(amount);
        
        emit Unlocked(recipient, amount, nonce, block.timestamp);
    }

    // Fallback admin unlock for safety during dev
    function adminUnlock(address recipient, uint256 amount, bytes32 nonce) external onlyAdmin {
        require(!processedNonces[nonce], "Nonce already processed");
        processedNonces[nonce] = true;
        payable(recipient).transfer(amount);
        emit Unlocked(recipient, amount, nonce, block.timestamp);
    }
    
    function setAdmin(address _admin) external onlyAdmin {
        admin = _admin;
    }
}








