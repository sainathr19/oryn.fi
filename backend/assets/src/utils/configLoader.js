const fs = require('fs').promises;
const path = require('path');

const configPath = path.join(__dirname, '../../config.json');

async function readConfig() {
    try {
        const configData = await fs.readFile(configPath, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        console.error('Error reading config.json:', error);
        throw new Error('Failed to load configuration');
    }
}

module.exports = { readConfig };
