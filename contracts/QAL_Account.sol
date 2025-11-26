// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// Abstract Account interface or similar
interface IAccount {
    function validateUserOp(bytes32 userOpHash, bytes calldata signature) external returns (uint256);
}

contract QAL_Account is IAccount {
    address public constant ML_DSA_VERIFY_PRECOMPILE = address(0x21);
    bytes public publicKey;

    constructor(bytes memory _publicKey) {
        publicKey = _publicKey;
    }

    function validateUserOp(bytes32 userOpHash, bytes calldata signature) external override returns (uint256) {
        // ABI Encode the arguments for the precompile: (bytes publicKey, bytes32 userOpHash, bytes signature)
        // Note: QAL precompile 0x21 expects this exact format.
        bytes memory encodedData = abi.encode(publicKey, userOpHash, signature);
        
        // Staticcall to 0x21
        (bool success, bytes memory result) = ML_DSA_VERIFY_PRECOMPILE.staticcall(encodedData);
        
        // Check if call succeeded and result is true (1)
        // result should be 32 bytes. If last byte is 1, valid.
        if (success && result.length == 32 && uint256(bytes32(result)) == 1) {
            return 0; // SIG_VALID (0) in AA Standard
        }
        
        return 1; // SIG_VALIDATION_FAILED (1)
    }
}

