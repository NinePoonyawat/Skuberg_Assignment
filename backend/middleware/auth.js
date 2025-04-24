const jwt = require("jsonwebtoken");
const { User } = require("../models");

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Authentication failed",
      error: error.message,
    });
  }
};
