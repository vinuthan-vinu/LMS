const AppError = require("../utils/AppError");

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";

  if (error.code === 11000) {
    statusCode = 400;
    message = `Duplicate value for ${Object.keys(error.keyValue).join(", ")}`;
  }

  if (error.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(error.errors)
      .map((validationError) => validationError.message)
      .join(", ");
  }

  if (error.name === "MulterError" || error.message === "Unsupported file type") {
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};
