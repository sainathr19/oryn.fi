# Oryn Protocol Backend Server

A modular Node.js server that reads and serves asset configuration data from `config.json` with a clean API structure.

## Features

- Reads asset configuration from `config.json`
- Serves assets data via GET endpoint
- Modular architecture with controllers, routes, and middleware
- Supports multiple token assets (USDC, WETH, WBTC, UNI)
- Pyth price feed configuration
- Health check endpoint
- CORS enabled
- Security headers via Helmet
- Error handling middleware
- Environment variable support

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on port 3001 by default.

## API Endpoints

### GET /assets
Returns the assets configuration data from `config.json`.

**Request:**
```bash
curl http://localhost:3001/assets
```


### GET /health
Health check endpoint to verify server status.

**Request:**
```bash
curl http://localhost:3001/health
```

**Response:**
```json
{
  "status": "OK",
  "uptime": 123.456
}
```

### GET /
Root endpoint with server information and available endpoints.

**Response:**
```json
{
  "message": "Oryn Protocol Backend Server",
  "version": "1.0.0",
  "endpoints": {
    "GET /assets": "Get assets data",
    "GET /health": "Health check"
  }
}
```

## Configuration Structure

The `config.json` file contains:

- **pyth**: Price feed contract address and price IDs
- **assets**: Token configurations with name, symbol, decimals, and token addresses

## Environment Variables

- `PORT`: Server port (default: 3001)

## Project Structure

```
backend/assets/
├── server.js                 # Main server entry point
├── config.json              # Configuration file
├── package.json             # Dependencies and scripts
├── src/
│   ├── controllers/         # Request handlers
│   │   └── assetsController.js
│   ├── middleware/          # Custom middleware
│   │   └── errorHandler.js
│   ├── routes/              # Route definitions
│   │   ├── index.js
│   │   └── assets.js
│   └── utils/               # Utility functions
│       └── configLoader.js
└── README.md
```

## Development

The server includes:
- Express.js for HTTP server
- CORS for cross-origin requests
- Helmet for security headers
- Nodemon for development auto-restart
- Modular architecture with separation of concerns
- Error handling middleware
- Environment variable support with dotenv
