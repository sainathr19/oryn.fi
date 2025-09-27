const { readConfig } = require('../utils/configLoader');

async function getAssets(req, res, next) {
    try {
        const config = await readConfig();

        if (!config?.chains) {
            return res.status(500).json({
                error: 'Configuration error',
                message: 'Chains not found in config.json'
            });
        }

        res.json({
            success: true,
            data: {
                chains: config.chains,
            },
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { getAssets };
