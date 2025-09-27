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
   * Updates all prices using the Pyth updatePriceFeeds function with retry logic and timeouts
   */
  private async updatePricesToOracle(): Promise<void> {
    const { MAX_RETRIES, RETRY_DELAY_MS, TRANSACTION_TIMEOUT_MS } = ORACLE_CONFIG;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        this.logger.info(`[Attempt ${attempt}/${MAX_RETRIES}] Starting price update process...`);
        
        // Fetch price data with timeout
        this.logger.info('Fetching price data from Pyth Network...');
        const priceData = await fetchPythPriceData();

        if (!priceData) {
          throw new Error('No price data received from Pyth Network');
        }

        this.logger.info(`Received price data from Pyth Network (length: ${priceData.length})`);

        // Create transaction with timeout
        this.logger.info('Preparing blockchain transaction...');
        const txPromise = this.oracleContract.updatePriceFeeds!(
          [`0x${priceData}`],  // Wrap in array since function expects bytes[]
          { 
            value: ORACLE_CONFIG.UPDATE_FEE_WEI,  // Add configured fee
            gasLimit: 500000  // Set explicit gas limit
          }
        );

        // Add timeout to transaction submission
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Transaction submission timed out after ${TRANSACTION_TIMEOUT_MS}ms`)), TRANSACTION_TIMEOUT_MS);
        });

        this.logger.info('Submitting transaction to blockchain...');
        const tx = await Promise.race([txPromise, timeoutPromise]) as any;

        this.logger.info(`Update transaction submitted: ${tx.hash}`);
        this.logger.info(`Gas used: ${tx.gasLimit?.toString() || 'unknown'}`);
        this.logger.info(`Gas price: ${tx.gasPrice?.toString() || 'unknown'}`);

        // Wait for transaction confirmation with timeout
        this.logger.info('Waiting for transaction confirmation...');
        const receiptPromise = tx.wait();
        const receiptTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Transaction confirmation timed out after ${TRANSACTION_TIMEOUT_MS}ms`)), TRANSACTION_TIMEOUT_MS);
        });

        const receipt = await Promise.race([receiptPromise, receiptTimeoutPromise]) as any;
        
        this.logger.info(`Update transaction confirmed: ${tx.hash}`);
        this.logger.info(`Block number: ${receipt.blockNumber}`);
        this.logger.info(`Gas used: ${receipt.gasUsed?.toString() || 'unknown'}`);
        this.logger.info(`Status: ${receipt.status === 1 ? 'SUCCESS' : 'FAILED'}`);
        
        if (receipt.status !== 1) {
          throw new Error(`Transaction failed with status: ${receipt.status}`);
        }
        
        // Success - break out of retry loop
        return;
        
      } catch (error) {
        this.logger.error(`[Attempt ${attempt}/${MAX_RETRIES}] Failed to update prices to oracle:`, error);
        
        if (attempt === MAX_RETRIES) {
          this.logger.error(`All ${MAX_RETRIES} attempts failed. Giving up.`);
          throw error;
        }
        
        this.logger.info(`Retrying in ${RETRY_DELAY_MS}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  /**
   * Get the oracle contract address
   */
  getOracleAddress(): string {
    return this.oracleContract.target as string;
  }
}