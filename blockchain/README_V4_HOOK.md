# Oryn Uniswap v4 Minting Hook

This directory now contains the Uniswap v4 hook for minting oUSD after adding liquidity, integrated with the existing OrynEngine.

## Files

- `src/OrynMintingHook.sol` - The main hook contract
- `script/deployOrynMintingHook.s.sol` - Deployment script

## How it works

1. User adds liquidity to a Uniswap v4 pool with the hook enabled
2. User specifies minting parameters via `hookData`:
   ```solidity
   struct MintingParams {
       bool shouldMint;        // Whether to mint oUSD
       uint256 mintAmount;     // Amount of oUSD to mint (in wei)
   }
   ```
3. The hook calls `OrynEngine.depositUniPositionAndMintFrom()` to:
   - Transfer the newly minted NFT position from the user to the OrynEngine
   - Mint the specified amount of oUSD to the user

## Usage

1. Deploy the hook using the deployment script
2. Create a pool with the hook address
3. When adding liquidity, encode `MintingParams` and pass as `hookData`

## Integration

The hook integrates directly with the existing `OrynEngine` contract, leveraging all existing validations and security measures.
