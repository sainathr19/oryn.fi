# Oryn Protocol Backend Server

A simple Node.js server that reads and serves configuration data from `config.json` via a POST endpoint.

## Features

- Reads configuration from `config.json`
- Serves config data via POST endpoint
- Includes blockchain network configurations
- Supports multiple token assets (USDC, WETH, WBTC, UNI)
- Pyth price feed configuration
- Health check endpoint
- CORS enabled
- Security headers via Helmet

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

### POST /config
Returns the complete configuration data from `config.json`.

**Request:**
```bash
curl -X POST http://localhost:3001/config
```

**Response:**
```json
{
  "success": true,
  "data": {
    "blockchain": { ... },
    "pyth": { ... },
    "assets": [ ... ],
    "features": { ... }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
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
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

### GET /
Root endpoint with server information.

## Configuration Structure

The `config.json` file contains:

- **blockchain**: Network configurations for mainnet, testnet, and localnet
- **pyth**: Price feed contract address and price IDs
- **assets**: Token configurations with addresses, decimals, and limits
- **features**: Feature flags for protocol functionality

## Environment Variables

- `PORT`: Server port (default: 3001)

## Development

The server includes:
- Express.js for HTTP server
- CORS for cross-origin requests
- Helmet for security headers
- Nodemon for development auto-restart

## Token Addresses

Current supported tokens:
- USDC: `0x38A72C43Abd3fCDC56764E0D0226d9d6D17c3192`
- WETH: `0x9CBEf80A86c1F9209F774a8807043F6Efec19042`
- WBTC: `0xeBf11B64DC588FcC2573c9a6Efda449888ef2B27`
- UNI: `0x0491bDD4BA0D32AC596744F79ce425A36aaF4db6`

## Pyth Integration

Price feed configuration:
- Contract: `0x818fC108459769e8D18dCcEc6768936720174155`
- Price IDs for ETH/USD, BTC/USD, USDC/USD, and UNI/USD
