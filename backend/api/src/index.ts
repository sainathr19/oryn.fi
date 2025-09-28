import { createServer } from './server';

async function main() {
  const { app, config } = createServer();

  app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });
}

// Start the application
main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
