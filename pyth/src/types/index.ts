/**
 * Chain-specific configuration interface
 */
export interface ChainConfig {
  chainId: number;
  chainName: string;
  rpcUrl: string;
  privateKey: string;
  oracleAddress: string;
  enabled: boolean;
}

/**
 * Application configuration interface supporting multiple chains
 */
export interface ApplicationConfig {
  chains: ChainConfig[];
}

/**
 * Legacy single-chain configuration interface (for backward compatibility)
 */
export interface LegacyApplicationConfig {
  rpcUrl: string;
  privateKey: string;
  oracleAddress: string;
}
