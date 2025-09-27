interface CoinGeckoPrice {
  [coinId: string]: {
    usd: number;
  };
}

interface CoinGeckoConfig {
  apiUrl: string;
  apiKey?: string;
}

export class CoinGeckoPriceFetcher {
  private readonly apiUrl: string;
  private readonly apiKey?: string;
  private readonly coinIds = ['bitcoin', 'ethereum', 'usd-coin'];

  constructor(config: CoinGeckoConfig) {
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
  }

  /**
   * Fetches prices for Bitcoin, Ethereum, and USDC from CoinGecko API
   */
  async getAllPrices(): Promise<Record<string, number>> {
    try {
      const coinIdsParam = this.coinIds.join(',');
      const url = `${this.apiUrl}?ids=${coinIdsParam}&vs_currencies=usd`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['x-cg-api-key'] = this.apiKey;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as CoinGeckoPrice;
      
      // Transform the response to match expected format
      const prices: Record<string, number> = {};
      for (const coinId of this.coinIds) {
        if (data[coinId] && data[coinId].usd) {
          prices[coinId] = data[coinId].usd;
        }
      }

      return prices;
    } catch (error) {
      console.error('Error fetching prices from CoinGecko:', error);
      throw error;
    }
  }

  /**
   * Fetches price for a specific coin
   */
  async getPrice(coinId: string): Promise<number | null> {
    try {
      const url = `${this.apiUrl}?ids=${coinId}&vs_currencies=usd`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['x-cg-api-key'] = this.apiKey;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as CoinGeckoPrice;
      
      return data[coinId]?.usd || null;
    } catch (error) {
      console.error(`Error fetching price for ${coinId}:`, error);
      throw error;
    }
  }
}
