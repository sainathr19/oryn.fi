require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/', routes);

app.use(errorHandler);

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

function shutdown(signal) {
    console.log(`${signal} received, shutting down gracefully...`);
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
