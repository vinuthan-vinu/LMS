const jwt = require("jsonwebtoken");

const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError("Authentication token is missing", 401);
  }

  const token = header.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    throw new AppError("User account not found", 401);
  }

  if (user.isActive === false) {
    throw new AppError("User account is deactivated", 403);
  }

  user.role = (user.role || "").toLowerCase();
  req.user = user;
  next();
});

const authorize = (...roles) => (req, res, next) => {
  const userRole = (req.user.role || "").toLowerCase();
  const allowedRoles = roles.map((role) => role.toLowerCase());

  if (!allowedRoles.includes(userRole)) {
    return next(new AppError("You do not have permission for this action", 403));
  }

  return next();
};

module.exports = {
  protect,
  authorize
};
