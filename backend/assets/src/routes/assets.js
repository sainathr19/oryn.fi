const express = require('express');
const { getAssets } = require('../controllers/assetsController');

const router = express.Router();

router.get('/', getAssets);

module.exports = router;
