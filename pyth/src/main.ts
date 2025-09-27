import { ethers } from 'ethers';
import { OracleManager } from './core/oracle-manager';
import { ConfigurationManager } from './config/settings';
import { oracleAbi } from '../abi/oracle';
import { FILE_PATHS } from './utils/constants';

async function main(): Promise<void> {
  try {
    // Load configuration
    const config = ConfigurationManager.fromJson(FILE_PATHS.CONFIG_FILE);
    
    // Create provider
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);

    // Create wallet from private key
    const wallet = new ethers.Wallet(config.privateKey, provider);
    const signerAddress = wallet.address;
    console.log('Signer address:', signerAddress);

    // Validate oracle address
    if (!ethers.isAddress(config.oracleAddress)) {
      throw new Error(`Invalid oracle address: ${config.oracleAddress}`);
    }

    const oracleContract = new ethers.Contract(config.oracleAddress, oracleAbi, wallet);

    // Create OracleManager instance
    const oracleManager = new OracleManager(oracleContract);

    await oracleManager.startPriceUpdates();

  } catch (error) {
    console.error('Fatal error in main:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
if (require.main === module) {
  main().catch((error) => {
    console.error('Application failed to start:', error);
    process.exit(1);
  });
}
