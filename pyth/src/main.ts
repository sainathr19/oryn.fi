import { MultichainManager } from './core/multichain-manager';
import { ConfigurationManager } from './config/settings';
import { FILE_PATHS } from './utils/constants';

async function main(): Promise<void> {
  try {    
    // Load configuration
    const config = ConfigurationManager.fromJson(FILE_PATHS.CONFIG_FILE);
    
    console.log(`Loaded configuration for ${config.chains.length} chains:`);
    config.chains.forEach(chain => {
      console.log(`  - ${chain.chainName} (Chain ID: ${chain.chainId}) - ${chain.enabled ? 'Enabled' : 'Disabled'}`);
    });

    // Create MultichainManager
    const multichainManager = new MultichainManager(config.chains);
    // Start price updates for all chains
    await multichainManager.startAllChains();

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
