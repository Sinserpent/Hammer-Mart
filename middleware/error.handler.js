// middlewares/globalErrorHandler.js
export const globalErrorHandler = (err, req, res, next) => {
  console.error("===== GLOBAL ERROR HANDLER =====");
  console.error("Timestamp:", new Date().toISOString());
  console.error("Request URL:", req.originalUrl);
  console.error("Method:", req.method);
  console.error("Headers:", req.headers);
  console.error("Body:", req.body);
  console.error("Query:", req.query);
  console.error("Params:", req.params);
  console.error("Error name:", err.name);
  console.error("Error message:", err.message);
  console.error("Error stack:", err.stack);
  console.error("Full error object:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
  if (err.response) {
    console.error("Axios response status:", err.response.status);
    console.error("Axios response data:", err.response.data);
  }
  console.error("================================");

  res.status(err.status || err.response?.status || 500).json({
    success: false,
    message: err.message || err.response?.data?.message || "Internal Server Error",
  });
};
