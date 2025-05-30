const User = require("../Models/user.model");
const jwt = require("jsonwebtoken");



module.exports.authUser = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token is", decoded); // Logs the payload (id, role, iat, exp)

    const userId = decoded.id;
    const role = decoded.role;

    console.log("The userId is", userId);
    console.log("The role is", role);

    // Check if the role is valid
    if (role !== "user" && role !== "admin") {
      return res.status(403).json({ message: "Access denied. Invalid role" });
    }

    // Example: Restrict access to users only
    if (role === "user") {
      console.log("Access granted to user");
    }

    // Example: Restrict access to admins only
    if (role === "admin") {
      console.log("Access granted to admin");
    }

    // Attach user info to the request object
    req.user = { id: userId, role };

    return next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
};



// Refresh Access Token
module.exports.refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  console.log("==== REFRESH TOKEN DEBUG ====");
  console.log("Cookies:", req.cookies);
  console.log("Refresh token received:", refreshToken);
  console.log("============================");

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const existingUser = await User.findById(decoded.id);
    if (!existingUser || existingUser.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generate a new access token
    const accessToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.status(200).json({ accessToken });
  } catch (err) {
    console.error("Error refreshing access token:", err.message);
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token" });
  }
};
