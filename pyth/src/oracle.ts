import { ethers } from 'ethers';
import { fetchPythPriceData } from './price';

export class PythOracle {
  private readonly oracleContract: ethers.Contract;

  constructor(
    oracleContract : ethers.Contract
  ) {
    this.oracleContract = oracleContract;
  }

  /**
   * Starts the price update loop that runs every 600 seconds
   */
  async startPriceUpdates(): Promise<void> {
    console.log('Starting PythOracle');

    while (true) {
      try {
        await this.updatePricesToOracle();
      } catch (error) {
        console.error('Failed to update prices:', error);
      }

      // Wait 600 seconds before next update
      await new Promise(resolve => setTimeout(resolve, 600000));
    }
  }

  /**
   * Updates all prices using the Pyth updatePriceFeeds function
   */
  private async updatePricesToOracle(): Promise<any> {
    let priceData = await fetchPythPriceData();

    if (priceData) {
      console.log("Got priceData");
    }

    try {
      const tx = await this.oracleContract.updatePriceFeeds!(
        [`0x${priceData}`],  // Wrap in array since function expects bytes[]
        { value: 10n }        // Add 10 wei as value
      );

      console.log("Update Transaction submitted : ", tx.hash);
      await tx.wait();
      console.log("Update Transaction confirmed : ", tx.hash);
    } catch (error) {
      console.error('Failed to update prices to oracle:', error);
      throw error;
    }
  }

  /**
   * Converts number price to Pyth format (price * 10^expo)
   * Uses asset-specific decimals/expo.
   */
  private static readonly ASSET_DECIMALS: Record<string, number> = {
    bitcoin: -8,
    eth: -18,
    usdc: -6,
  };

  /**
   * Get the oracle contract address
   */
  getOracleAddress(): string {
    return this.oracleContract.target as string;
  }
}