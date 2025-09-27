import { CoinGeckoPriceFetcher } from './coingecko';
import { createServer } from './server';

async function main() {
  const { app, config } = createServer();

  let coingecko = new CoinGeckoPriceFetcher(config.coingecko);

  let prices = await coingecko.getAllPrices();

  console.log(prices);

  app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });
}

// Start the application
main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
