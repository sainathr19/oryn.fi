# Pyth Oracle Service

A TypeScript service for updating blockchain oracle contracts with real-time price data from Pyth Network. **Now with multichain support!**

## Project Structure

```
src/
├── core/                    # Core business logic
│   ├── oracle-manager.ts    # Main oracle management class
│   └── multichain-manager.ts # Multichain coordination manager
├── services/                # External service integrations
│   └── pyth-price-service.ts # Pyth Network API integration
├── config/                  # Configuration management
│   └── settings.ts          # Configuration loader and validator
├── types/                   # Type definitions
│   └── index.ts            # Application interfaces
├── utils/                   # Utility functions and constants
│   └── constants.ts        # Application-wide constants
├── main.ts                 # Application entry point
└── index.ts                # Main exports
```

## Key Features

### Multichain Support
- **Multiple Chains**: Support for running oracle updates across multiple blockchain networks simultaneously
- **Chain-Specific Logging**: Each chain has its own logger with prefixed messages for easy identification
- **Independent Management**: Each chain runs its own OracleManager instance with separate configurations
- **Concurrent Updates**: All chains update prices concurrently for maximum efficiency

### Configuration Management
- **Backward Compatibility**: Supports both legacy single-chain and new multichain configurations
- **Environment Variables**: Chain-specific environment variable overrides
- **Enable/Disable Chains**: Individual chains can be enabled or disabled via configuration
- **Validation**: Comprehensive validation for all chain configurations

### Enhanced Logging
- **Chain-Specific Prefixes**: All log messages are prefixed with chain name and ID
- **Structured Logging**: Consistent logging format across all chains
- **Error Isolation**: Errors in one chain don't affect other chains

### Organization
- **Separation of Concerns**: Core logic, services, configuration, and utilities are properly separated
- **Centralized Constants**: All configuration values are centralized in `utils/constants.ts`
- **Better Imports**: Clean import structure with proper module organization
- **Type Safety**: Enhanced type definitions with better naming

## Usage

### Multichain Configuration

```typescript
import { MultichainManager, ConfigurationManager } from './src';

// Load multichain configuration
const config = ConfigurationManager.fromJson();

// Create multichain manager
const multichainManager = new MultichainManager(config.chains);

// Start price updates for all chains
await multichainManager.startAllChains();
```

### Single Chain (Legacy Support)

```typescript
import { OracleManager, ConfigurationManager } from './src';

// Load configuration (automatically converts legacy format)
const config = ConfigurationManager.fromJson();

// Create oracle manager for first chain
const oracleManager = new OracleManager(oracleContract);

// Start price updates
await oracleManager.startPriceUpdates();
```

## Environment Variables

### Global Environment Variables
- `REDEEMER_RPC_URL`: Default RPC endpoint (for legacy compatibility)
- `REDEEMER_PRIVATE_KEY`: Default private key (for legacy compatibility)
- `REDEEMER_ORACLE_ADDRESS`: Default oracle address (for legacy compatibility)

### Chain-Specific Environment Variables
- `REDEEMER_RPC_URL_0`: RPC endpoint for chain index 0
- `REDEEMER_PRIVATE_KEY_0`: Private key for chain index 0
- `REDEEMER_ORACLE_ADDRESS_0`: Oracle address for chain index 0
- `REDEEMER_RPC_URL_1`: RPC endpoint for chain index 1
- `REDEEMER_PRIVATE_KEY_1`: Private key for chain index 1
- `REDEEMER_ORACLE_ADDRESS_1`: Oracle address for chain index 1
- ... and so on for additional chains

## Configuration File

The service uses `Settings.json` for configuration with environment variable overrides.

### Multichain Configuration Format

```json
{
    "chains": [
        {
            "chainId": 11155111,
            "chainName": "Ethereum Sepolia",
            "rpcUrl": "https://sepolia.infura.io/v3/YOUR_KEY",
            "privateKey": "YOUR_PRIVATE_KEY",
            "oracleAddress": "0x...",
            "enabled": true
        },
        {
            "chainId": 1,
            "chainName": "Ethereum Mainnet",
            "rpcUrl": "https://mainnet.infura.io/v3/YOUR_KEY",
            "privateKey": "YOUR_PRIVATE_KEY",
            "oracleAddress": "0x...",
            "enabled": false
        }
    ]
}
```

### Legacy Single-Chain Format (Still Supported)

```json
{
    "rpcUrl": "https://sepolia.infura.io/v3/YOUR_KEY",
    "privateKey": "YOUR_PRIVATE_KEY",
    "oracleAddress": "0x..."
}
```

## Logging

The service provides chain-specific logging with prefixed messages:

```
[Ethereum Sepolia:11155111] Starting OracleManager
[Ethereum Sepolia:11155111] Received price data from Pyth Network
[Ethereum Sepolia:11155111] Update transaction submitted: 0x...
[Ethereum Sepolia:11155111] Update transaction confirmed: 0x...
[MultichainManager:0] MultichainManager initialized with 1 active chains
```