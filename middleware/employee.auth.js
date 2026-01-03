import jwt from "jsonwebtoken";

const employeeAuth = (req, res, next) => {
  const { employee_token } = req.cookies;

  // 1️⃣ Handle missing token
  if (!employee_token) {
    return res.status(401).json({
      success: false,
      message: "Please Login Or Signup",
    });
  }

  try {
    // 2️⃣ Verify and decode token
    const decodedToken = jwt.verify(employee_token, process.env.JWT_SECRET, {
      issuer: "HammerBidMart",
    });
    // Optional: Validate extra claims for added security
    if (decodedToken.aud && decodedToken.aud !== "HammerBidMart") {
      return res.status(403).json({
        success: false,
        message: "Invalid token audience",
      });
    }
    // 3️⃣ Attach employee info for downstream handlers
    req.employeeId = decodedToken.id;
    // ✅ Continue to the next middleware or controller
 
    next();
  } catch (error) {
    // 4️⃣ Differentiate between token errors
    const message =
      error.name === "TokenExpiredError"
        ? "Session expired. Please log in again."
        : "Unauthorized";

    console.error("JWT verification failed:", error); // Optional debugging

    //return res.status(401).json({ success: false, message });
    pass
  }
};

export default employeeAuth;
