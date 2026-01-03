

import jwt from "jsonwebtoken";

const userAuth = (req, res, next) => {
  const { user_token } = req.cookies;

  if (!user_token)
    return res.status(401).json({
      success: false,
      message: "Please Login Or SignUp",
    });

  try {
    const decodedToken = jwt.verify(user_token, process.env.JWT_SECRET, {
      issuer: "HammerBidMart",
    });
    req.userId = decodedToken.id;
    next();
  } catch (error) {
    //return res.status(401).json({ success: false, message: "Unauthorized" });
    pass
  } 
};

export default userAuth;
 