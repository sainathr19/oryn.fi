import * as fs from 'fs';
import { ApplicationConfig, ChainConfig, LegacyApplicationConfig } from '../types';
import { FILE_PATHS, ENV_VARS } from '../utils/constants';

export class ConfigurationManager {
  private static readonly CONFIG_FILE = FILE_PATHS.CONFIG_FILE;
  
  /**
   * Load configuration from JSON file with environment variable overrides
   * Supports both multichain and legacy single-chain configurations
   */
  static fromJson(filePath?: string): ApplicationConfig {
    const settingsPath = filePath || this.CONFIG_FILE;
    
    try {
      const settings = this.tryFromJson(settingsPath);
      return settings;
    } catch (error) {
      console.error(`Failed to load settings from ${settingsPath}:`, error);
      throw new Error(`Missing required configuration variables: ${error}`);
    }
  }

  /**
   * Try to load configuration from JSON file with environment variable overrides
   * Handles both multichain and legacy single-chain configurations
   */
  private static tryFromJson(filePath: string): ApplicationConfig {
    let fileSettings: any = {};
    
    // Load from file if it exists
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      fileSettings = JSON.parse(fileContent);
    }

    // Check if it's a legacy single-chain configuration
    if (fileSettings.rpcUrl && !fileSettings.chains) {
      console.log('Detected legacy single-chain configuration, converting to multichain format');
      return this.convertLegacyToMultichain(fileSettings);
    }

    // Handle multichain configuration
    if (fileSettings.chains && Array.isArray(fileSettings.chains)) {
      return this.processMultichainConfig(fileSettings);
    }

    throw new Error('Invalid configuration format. Expected either legacy format or multichain format with "chains" array');
  }

  /**
   * Convert legacy single-chain configuration to multichain format
   */
  private static convertLegacyToMultichain(legacyConfig: LegacyApplicationConfig): ApplicationConfig {
    const chainConfig: ChainConfig = {
      chainId: 1, // Default to Ethereum mainnet
      chainName: 'Ethereum',
      rpcUrl: legacyConfig.rpcUrl,
      privateKey: legacyConfig.privateKey,
      oracleAddress: legacyConfig.oracleAddress,
      enabled: true
    };

    return {
      chains: [chainConfig]
    };
  }

  /**
   * Process multichain configuration with environment variable overrides
   */
  private static processMultichainConfig(fileSettings: any): ApplicationConfig {
    const chains: ChainConfig[] = fileSettings.chains.map((chain: any, index: number) => {
      // Apply environment variable overrides for each chain
      const chainConfig: ChainConfig = {
        chainId: chain.chainId,
        chainName: chain.chainName,
        rpcUrl: process.env[`${ENV_VARS.RPC_URL}_${index}`] || chain.rpcUrl,
        privateKey: process.env[`${ENV_VARS.PRIVATE_KEY}_${index}`] || chain.privateKey,
        oracleAddress: process.env[`${ENV_VARS.ORACLE_ADDRESS}_${index}`] || chain.oracleAddress,
        enabled: chain.enabled !== false // Default to true if not specified
      };

      // Validate required fields for each chain
      const requiredFields: (keyof ChainConfig)[] = ['chainId', 'chainName', 'rpcUrl', 'privateKey', 'oracleAddress'];
      const missingFields = requiredFields.filter(field => !chainConfig[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Chain ${chainConfig.chainName} (${chainConfig.chainId}) missing required fields: ${missingFields.join(', ')}`);
      }

      return chainConfig;
    });

    // Filter out disabled chains
    const enabledChains = chains.filter(chain => chain.enabled);
    
    if (enabledChains.length === 0) {
      throw new Error('No enabled chains found in configuration');
    }

    return { chains: enabledChains };
  }
}
