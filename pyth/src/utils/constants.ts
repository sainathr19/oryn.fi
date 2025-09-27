/**
 * Application-wide constants
 */

// File paths
export const FILE_PATHS = {
  CONFIG_FILE: 'Settings.json',
} as const;

// Environment variable names
export const ENV_VARS = {
  RPC_URL: 'REDEEMER_RPC_URL',
  PRIVATE_KEY: 'REDEEMER_PRIVATE_KEY',
  ORACLE_ADDRESS: 'REDEEMER_ORACLE_ADDRESS',
} as const;

// Oracle configuration
export const ORACLE_CONFIG = {
  UPDATE_INTERVAL_MS: 600000, // 10 minutes
  UPDATE_FEE_WEI: 10n, // 10 wei fee for updates
  TRANSACTION_TIMEOUT_MS: 300000, // 5 minutes timeout for transactions
  MAX_RETRIES: 3, // Maximum number of retries for failed operations
  RETRY_DELAY_MS: 10000, // 10 seconds delay between retries
  API_TIMEOUT_MS: 30000, // 30 seconds timeout for API calls
} as const;

// Pyth Network configuration
export const PYTH_NETWORK_CONFIG = {
  API_BASE_URL: 'https://hermes.pyth.network/v2/updates/price/latest',
  PRICE_FEED_IDS: [
    'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43', // BTC/USD
    'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace', // ETH/USD
    '78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501', // USDC/USD
    'eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a'  // Additional feed
  ]
} as const;

// Asset-specific decimals/expo for price conversion
export const ASSET_DECIMALS = {
  bitcoin: -8,
  eth: -18,
  usdc: -6,
} as const;
