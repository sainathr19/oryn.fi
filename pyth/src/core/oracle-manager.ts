import { ethers } from 'ethers';
import { fetchPythPriceData } from '../services/pyth-price-service';
import { ORACLE_CONFIG } from '../utils/constants';

export class OracleManager {
  private readonly oracleContract: ethers.Contract;

  constructor(oracleContract: ethers.Contract) {
    this.oracleContract = oracleContract;
  }

  /**
   * Starts the price update loop that runs every 600 seconds
   */
  async startPriceUpdates(): Promise<void> {
    console.log('Starting OracleManager');

    while (true) {
      try {
        await this.updatePricesToOracle();
      } catch (error) {
        console.error('Failed to update prices:', error);
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

    console.log('Received price data from Pyth Network');

    try {
      const tx = await this.oracleContract.updatePriceFeeds!(
        [`0x${priceData}`],  // Wrap in array since function expects bytes[]
        { value: ORACLE_CONFIG.UPDATE_FEE_WEI }  // Add configured fee
      );

      console.log('Update transaction submitted:', tx.hash);
      await tx.wait();
      console.log('Update transaction confirmed:', tx.hash);
    } catch (error) {
      console.error('Failed to update prices to oracle:', error);
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