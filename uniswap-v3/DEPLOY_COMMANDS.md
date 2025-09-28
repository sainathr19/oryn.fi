# Uniswap V3 Deployment Commands

## Local Testing (Anvil)
```bash
# 1. Start Anvil (in separate terminal)
anvil

# 2. Deploy to local network
forge script script/DeployUniswapV3Simple.s.sol:DeployUniswapV3Simple \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

## Testnet Deployment
```bash
# Sepolia
forge script script/DeployUniswapV3Simple.s.sol:DeployUniswapV3Simple \
  --rpc-url https://sepolia.infura.io/v3/YOUR_INFURA_KEY \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY

# Goerli
forge script script/DeployUniswapV3Simple.s.sol:DeployUniswapV3Simple \
  --rpc-url https://goerli.infura.io/v3/YOUR_INFURA_KEY \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

## Mainnet Deployment (High Gas Costs!)
```bash
forge script script/DeployUniswapV3Simple.s.sol:DeployUniswapV3Simple \
  --rpc-url https://mainnet.infura.io/v3/YOUR_INFURA_KEY \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --gas-price 20000000000
```

## Alternative Networks
```bash
# Polygon
forge script script/DeployUniswapV3Simple.s.sol:DeployUniswapV3Simple \
  --rpc-url https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY \
  --private-key $PRIVATE_KEY \
  --broadcast

# Arbitrum One
forge script script/DeployUniswapV3Simple.s.sol:DeployUniswapV3Simple \
  --rpc-url https://arbitrum-mainnet.infura.io/v3/YOUR_INFURA_KEY \
  --private-key $PRIVATE_KEY \
  --broadcast

# Optimism
forge script script/DeployUniswapV3Simple.s.sol:DeployUniswapV3Simple \
  --rpc-url https://optimism-mainnet.infura.io/v3/YOUR_INFURA_KEY \
  --private-key $PRIVATE_KEY \
  --broadcast
```