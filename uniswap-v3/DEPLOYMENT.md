# Uniswap V3 Deployment Guide

This guide explains how to deploy Uniswap V3 contracts using Foundry.

## Prerequisites

1. **Install Foundry** (if not already installed):
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your private key and RPC URLs
   ```

## Deployment Steps

### 1. Build the contracts
```bash
forge build
```

### 2. Deploy to testnet (recommended first)
```bash
# Deploy to Sepolia testnet
forge script script/DeployUniswapV3.s.sol:DeployUniswapV3 \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv
```

### 3. Deploy to mainnet
```bash
# Deploy to Ethereum mainnet (use with caution!)
forge script script/DeployUniswapV3.s.sol:DeployUniswapV3 \
  --rpc-url $MAINNET_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv
```

### 4. Deploy to other networks
```bash
# Polygon
forge script script/DeployUniswapV3.s.sol:DeployUniswapV3 \
  --rpc-url $POLYGON_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $POLYGONSCAN_API_KEY \
  -vvvv

# Arbitrum
forge script script/DeployUniswapV3.s.sol:DeployUniswapV3 \
  --rpc-url $ARBITRUM_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ARBISCAN_API_KEY \
  -vvvv
```

## Important Notes

### Contract Deployment Order
The script deploys contracts in the correct order:
1. **UniswapV3Factory** - Core factory contract
2. **NonfungibleTokenPositionDescriptor** - NFT metadata generator
3. **NonfungiblePositionManager** - Liquidity position manager
4. **SwapRouter** - Token swap router

### Network-Specific Considerations

#### WETH9 Addresses
- **Ethereum Mainnet**: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`
- **Sepolia**: `0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9`
- **Polygon**: `0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270` (WMATIC)
- **Arbitrum**: `0x82aF49447D8a07e3bd95BD0d56f35241523fBab1`

Update the `WETH9` constant in the deployment script for different networks.

#### Gas Considerations
- Mainnet deployment can be expensive (0.1-0.5 ETH in gas)
- Test on testnets first
- Consider using `--gas-price` flag for gas optimization

### After Deployment

1. **Save addresses**: The script will output all deployed contract addresses
2. **Create pools**: Use the factory to create trading pools
3. **Set up initial liquidity**: Use the position manager to add initial liquidity
4. **Configure fees**: Set protocol fees if you're the factory owner

## Creating a Pool

After deployment, you can create a pool:

```solidity
// Example: Create USDC/WETH pool with 0.3% fee
address pool = factory.createPool(
    0xA0b86991c431e59Da0e2108B448c6035bbC2d93C, // USDC
    0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2, // WETH
    3000 // 0.3% fee
);

// Initialize with price (example: 1 ETH = 2000 USDC)
IUniswapV3Pool(pool).initialize(79228162514264337593543950336); // sqrtPriceX96
```

## Security Checklist

- [ ] Test deployment on testnet first
- [ ] Verify all contracts on Etherscan
- [ ] Double-check WETH9 address for target network
- [ ] Ensure sufficient ETH for gas fees
- [ ] Use a secure private key management system
- [ ] Consider using a multisig for factory ownership

## Troubleshooting

### Common Issues
1. **Out of gas**: Increase gas limit or gas price
2. **Nonce mismatch**: Check if previous transactions are pending
3. **Contract already deployed**: Each deployment creates new contracts
4. **WETH9 not found**: Update WETH9 address for your network

### Getting Help
- Check Foundry documentation: https://book.getfoundry.sh/
- Uniswap V3 documentation: https://docs.uniswap.org/
- GitHub issues: Create an issue in your repository