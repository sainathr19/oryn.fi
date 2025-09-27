import { ethers } from 'ethers';
import { fetchPythPriceData } from '../services/pyth-price-service';
import { ORACLE_CONFIG } from '../utils/constants';

/**
 * Logger interface for chain-specific logging
 */
export interface Logger {
  info(message: string): void;
  error(message: string, error?: any): void;
  warn(message: string): void;
  debug(message: string): void;
}

export class OracleManager {
  private readonly oracleContract: ethers.Contract;
  private readonly logger: Logger;

  constructor(oracleContract: ethers.Contract, logger?: Logger) {
    this.oracleContract = oracleContract;
    this.logger = logger || this.createDefaultLogger();
  }

  /**
   * Create a default logger if none is provided
   */
  private createDefaultLogger(): Logger {
    return {
      info: (message: string) => console.log(message),
      error: (message: string, error?: any) => console.error(message, error || ''),
      warn: (message: string) => console.warn(message),
      debug: (message: string) => console.debug(message)
    };
  }

  /**
   * Starts the price update loop that runs every 600 seconds
   */
  async startPriceUpdates(): Promise<void> {
    this.logger.info('Starting OracleManager');

    while (true) {
      try {
        await this.updatePricesToOracle();
      } catch (error) {
        this.logger.error('Failed to update prices:', error);
      }

      // Wait for the configured interval before next update
      await new Promise(resolve => setTimeout(resolve, ORACLE_CONFIG.UPDATE_INTERVAL_MS));
    }
  }

  /**
   * Updates all prices using the Pyth updatePriceFeeds function
   */
  private async updatePricesToOracle(): Promise<void> {
    const priceData = await fetchPythPriceData();

    if (!priceData) {
      throw new Error('No price data received from Pyth Network');
    }

    this.logger.info('Received price data from Pyth Network');

    try {
      const tx = await this.oracleContract.updatePriceFeeds!(
        [`0x${priceData}`],  // Wrap in array since function expects bytes[]
        { value: ORACLE_CONFIG.UPDATE_FEE_WEI }  // Add configured fee
      );

      this.logger.info(`Update transaction submitted: ${tx.hash}`);
      await tx.wait();
      this.logger.info(`Update transaction confirmed: ${tx.hash}`);
    } catch (error) {
      this.logger.error('Failed to update prices to oracle:', error);
      throw error;
    }
  }

  /**
   * Get the oracle contract address
   */
  getOracleAddress(): string {
    return this.oracleContract.target as string;
  }
}