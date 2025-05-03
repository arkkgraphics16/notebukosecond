// backend/middleware/errorHandler.js
export function errorHandler(err, req, res, next) {
    // Log the error stack trace for debugging
    console.error('Error:', err.stack);
  
    // Determine the status code (default to 500 if not set)
    const statusCode = err.statusCode || 500;
  
    // Return a JSON response with the error message
    res.status(statusCode).json({
      error: err.message || 'Internal Server Error'
    });
  }