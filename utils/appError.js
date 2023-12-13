class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4')
      ? 'fail'
      : 'error';
    this.isOperational = true; //so that these are operational errors it differentiates them from programming errors
    Error.captureStackTrace(
      this,
      this.constructor,
      // we dont want to add this class to stackTrace
    );
  }
}
module.exports = AppError;
