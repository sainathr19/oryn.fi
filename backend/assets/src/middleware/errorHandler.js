function errorHandler(err, req, res, next) {
    console.error('Error:', err.message);

    res.status(500).json({
        error: 'Internal server error',
        message: err.message || 'Unexpected error occurred',
    });
}

module.exports = errorHandler;
