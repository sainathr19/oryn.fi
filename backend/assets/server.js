const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

const configPath = path.join(__dirname, 'config.json');

function readConfig() {
    try {
        const configData = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        console.error('Error reading config.json:', error);
        return null;
    }
}

app.get('/assets', (req, res) => {
    try {
        const config = readConfig();

        if (!config || !config.assets) {
            return res.status(500).json({
                error: 'Failed to load assets configuration',
                message: 'Could not load assets from config.json'
            });
        }

        res.json({
            success: true,
            data: config.assets,
        });

    } catch (error) {
        console.error('Error serving assets:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'An error occurred while serving the assets'
        });
    }
});

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        uptime: process.uptime()
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Oryn Protocol Backend Server',
        version: '1.0.0',
        endpoints: {
            'GET /assets': 'Get assets data',
            'GET /health': 'Health check'
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
