const { readConfig } = require('../utils/configLoader');

async function getAssets(req, res, next) {
    try {
        const config = await readConfig();

        if (!config?.assets) {
            return res.status(500).json({
                error: 'Configuration error',
                message: 'Assets not found in config.json'
            });
        }

        res.json({
            success: true,
            data: config.assets,
        });
    } catch (error) {
        next(error); // Pass to error middleware
    }
}

module.exports = { getAssets };
