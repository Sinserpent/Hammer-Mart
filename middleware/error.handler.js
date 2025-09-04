// middlewares/globalErrorHandler.js
export const globalErrorHandler = (err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || err.response?.status || 500).json({
    success: false,
    message: err.message || err.response?.data?.message || 'Internal Server Error',
  });
};
