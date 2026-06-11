module.exports = (err, req, res, next) => {
  console.error("🔥 Error Handler:", err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Server Error";

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};