# Pyth Oracle Service

A TypeScript service for updating blockchain oracle contracts with real-time price data from Pyth Network.

## Project Structure

```
src/
├── core/                    # Core business logic
│   └── oracle-manager.ts    # Main oracle management class
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

## Key Improvements

### Naming Conventions
- **Functions**: `fetchPythPriceData()` instead of `get_prices()`
- **Classes**: `OracleManager` instead of `PythOracle`
- **Classes**: `ConfigurationManager` instead of `SettingsManager`
- **Types**: `ApplicationConfig` instead of `Settings` (with backward compatibility)

### Organization
- **Separation of Concerns**: Core logic, services, configuration, and utilities are properly separated
- **Centralized Constants**: All configuration values are centralized in `utils/constants.ts`
- **Better Imports**: Clean import structure with proper module organization
- **Type Safety**: Enhanced type definitions with better naming

### Configuration
- **Environment Variables**: Centralized environment variable names
- **File Paths**: Centralized file path constants
- **Oracle Settings**: Centralized oracle configuration (intervals, fees, etc.)
- **Pyth Network Settings**: Centralized API configuration and price feed IDs

## Usage

```typescript
import { OracleManager, ConfigurationManager } from './src';

// Load configuration
const config = ConfigurationManager.fromJson();

// Create oracle manager
const oracleManager = new OracleManager(oracleContract);

// Start price updates
await oracleManager.startPriceUpdates();
```

## Environment Variables

- `REDEEMER_RPC_URL`: Ethereum RPC endpoint
- `REDEEMER_PRIVATE_KEY`: Private key for transaction signing
- `REDEEMER_ORACLE_ADDRESS`: Oracle contract address

## Configuration File

The service uses `Settings.json` for configuration with environment variable overrides.