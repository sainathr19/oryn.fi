import { ethers } from 'ethers';
import { OracleManager } from './oracle-manager';
import { ChainConfig } from '../types';
import { oracleAbi } from '../../abi/oracle';

/**
 * Chain-specific Oracle Manager wrapper with logging
 */
class ChainOracleManager {
  private readonly oracleManager: OracleManager;
  private readonly chainConfig: ChainConfig;
  private readonly logger: ChainLogger;

  constructor(chainConfig: ChainConfig) {
    this.chainConfig = chainConfig;
    this.logger = new ChainLogger(chainConfig.chainName, chainConfig.chainId);
    
    // Create provider and wallet for this chain
    const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
    const wallet = new ethers.Wallet(chainConfig.privateKey, provider);
    
    // Validate oracle address
    if (!ethers.isAddress(chainConfig.oracleAddress)) {
      throw new Error(`Invalid oracle address for ${chainConfig.chainName}: ${chainConfig.oracleAddress}`);
    }

    const oracleContract = new ethers.Contract(chainConfig.oracleAddress, oracleAbi, wallet);
    this.oracleManager = new OracleManager(oracleContract, this.logger);
    
    this.logger.info(`Initialized OracleManager for ${chainConfig.chainName} (Chain ID: ${chainConfig.chainId})`);
    this.logger.info(`Oracle Address: ${chainConfig.oracleAddress}`);
    this.logger.info(`Wallet Address: ${wallet.address}`);
  }

  /**
   * Start price updates for this chain
   */
  async startPriceUpdates(): Promise<void> {
    this.logger.info('Starting price updates...');
    await this.oracleManager.startPriceUpdates();
  }

  /**
   * Get chain configuration
   */
  getChainConfig(): ChainConfig {
    return this.chainConfig;
  }

  /**
   * Get oracle manager instance
   */
  getOracleManager(): OracleManager {
    return this.oracleManager;
  }
}

/**
 * Chain-specific logger that prefixes all messages with chain information
 */
class ChainLogger {
  private readonly chainName: string;
  private readonly chainId: number;
  private readonly prefix: string;

  constructor(chainName: string, chainId: number) {
    this.chainName = chainName;
    this.chainId = chainId;
    this.prefix = `[${chainName}:${chainId}]`;
  }

  info(message: string): void {
    console.log(`${this.prefix} ${message}`);
  }

  error(message: string, error?: any): void {
    console.error(`${this.prefix} ${message}`, error || '');
  }

  warn(message: string): void {
    console.warn(`${this.prefix} ${message}`);
  }

  debug(message: string): void {
    console.debug(`${this.prefix} ${message}`);
  }
}

/**
 * Multichain Manager that coordinates Oracle Managers across multiple chains
 */
export class MultichainManager {
  private readonly chainManagers: ChainOracleManager[] = [];
  private readonly logger: ChainLogger;

  constructor(chains: ChainConfig[]) {
    this.logger = new ChainLogger('MultichainManager', 0);
    
    this.logger.info(`Initializing MultichainManager with ${chains.length} chains`);
    
    // Initialize Oracle Managers for each chain
    for (const chainConfig of chains) {
      try {
        const chainManager = new ChainOracleManager(chainConfig);
        this.chainManagers.push(chainManager);
        this.logger.info(`Successfully initialized ${chainConfig.chainName}`);
      } catch (error) {
        this.logger.error(`Failed to initialize ${chainConfig.chainName}:`, error);
        throw error;
      }
    }

    this.logger.info(`MultichainManager initialized with ${this.chainManagers.length} active chains`);
  }

  /**
   * Start price updates for all chains concurrently
   */
  async startAllChains(): Promise<void> {
    this.logger.info('Starting price updates for all chains...');
    
    const startPromises = this.chainManagers.map(async (chainManager) => {
      const chainConfig = chainManager.getChainConfig();
      try {
        await chainManager.startPriceUpdates();
      } catch (error) {
        this.logger.error(`Chain ${chainConfig.chainName} failed:`, error);
        throw error;
      }
    });

    // Start all chains concurrently
    await Promise.all(startPromises);
  }

  /**
   * Start price updates for a specific chain
   */
  async startChain(chainId: number): Promise<void> {
    const chainManager = this.chainManagers.find(cm => cm.getChainConfig().chainId === chainId);
    
    if (!chainManager) {
      throw new Error(`Chain with ID ${chainId} not found`);
    }

    const chainConfig = chainManager.getChainConfig();
    this.logger.info(`Starting price updates for ${chainConfig.chainName}...`);
    
    await chainManager.startPriceUpdates();
  }

  /**
   * Get all chain configurations
   */
  getAllChainConfigs(): ChainConfig[] {
    return this.chainManagers.map(cm => cm.getChainConfig());
  }

  /**
   * Get chain configuration by chain ID
   */
  getChainConfig(chainId: number): ChainConfig | undefined {
    const chainManager = this.chainManagers.find(cm => cm.getChainConfig().chainId === chainId);
    return chainManager?.getChainConfig();
  }

  /**
   * Get the number of active chains
   */
  getActiveChainCount(): number {
    return this.chainManagers.length;
  }

  /**
   * Get chain manager by chain ID
   */
  getChainManager(chainId: number): ChainOracleManager | undefined {
    return this.chainManagers.find(cm => cm.getChainConfig().chainId === chainId);
  }
}
