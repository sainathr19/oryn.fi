import express from 'express';
import { loadConfig } from './config';
import { CoinGeckoPriceFetcher } from './coingecko';
import { TOKEN_ADDRESS_TO_COINGECKO_ID } from './constants';

export function createServer() {
  const config = loadConfig();
  const app = express();
  const coingecko = new CoinGeckoPriceFetcher(config.coingecko);

  // Health endpoint
  app.get('/health', (req, res) => {
    res.send('Online');
  });

  // Fiat prices endpoint
  app.get('/fiat', async (_req, res) => {
    try {
      const prices = await coingecko.getAllPrices();
      
      // Map token addresses to fiat values
      const tokenAddressToFiat: Record<string, number> = {};
      
      for (const [tokenAddress, coinGeckoId] of Object.entries(TOKEN_ADDRESS_TO_COINGECKO_ID)) {
        if (prices[coinGeckoId]) {
          tokenAddressToFiat[tokenAddress] = prices[coinGeckoId];
        }
      }
      
      res.json(tokenAddressToFiat);
    } catch (error) {
      console.error('Error fetching fiat prices:', error);
      res.status(500).json({ error: 'Failed to fetch fiat prices' });
    }
  });

  return { app, config };
}
