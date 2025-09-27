import * as fs from 'fs';
import { ApplicationConfig } from '../types';
import { FILE_PATHS, ENV_VARS } from '../utils/constants';

export class ConfigurationManager {
  private static readonly CONFIG_FILE = FILE_PATHS.CONFIG_FILE;
  
  /**
   * Load configuration from JSON file with environment variable overrides
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
   */
  private static tryFromJson(filePath: string): ApplicationConfig {
    let fileSettings: Partial<ApplicationConfig> = {};
    
    // Load from file if it exists
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      fileSettings = JSON.parse(fileContent);
    }

    // Override with environment variables
    const envSettings: Partial<ApplicationConfig> = {};
    
    if (process.env[ENV_VARS.RPC_URL] || fileSettings.rpcUrl) {
      envSettings.rpcUrl = process.env[ENV_VARS.RPC_URL] || fileSettings.rpcUrl;
    }
    if (process.env[ENV_VARS.PRIVATE_KEY] || fileSettings.privateKey) {
      envSettings.privateKey = process.env[ENV_VARS.PRIVATE_KEY] || fileSettings.privateKey;
    }
    if (process.env[ENV_VARS.ORACLE_ADDRESS] || fileSettings.oracleAddress) {
      envSettings.oracleAddress = process.env[ENV_VARS.ORACLE_ADDRESS] || fileSettings.oracleAddress;
    }

    // Validate required fields
    const requiredFields: (keyof ApplicationConfig)[] = ['rpcUrl', 'privateKey', 'oracleAddress'];
    const missingFields = requiredFields.filter(field => !envSettings[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required configuration fields: ${missingFields.join(', ')}`);
    }

    return envSettings as ApplicationConfig;
  }
}
