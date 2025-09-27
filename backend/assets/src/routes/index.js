const express = require('express');
const assetsRoutes = require('./assets');

const router = express.Router();

router.use('/assets', assetsRoutes);

router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        uptime: process.uptime(),
    });
});

router.get('/', (req, res) => {
    res.json({
        message: 'Oryn Protocol Backend Server',
        version: '1.0.0',
        endpoints: {
            'GET /assets': 'Get assets data',
            'GET /health': 'Health check'
        }
    });
});

module.exports = router;
