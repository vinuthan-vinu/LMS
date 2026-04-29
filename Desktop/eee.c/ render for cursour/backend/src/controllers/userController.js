const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const listUsers = asyncHandler(async (req, res) => {
  const query = {};

  if (req.query.role) {
    query.role = req.query.role;
  }

  if (req.query.department) {
    query.department = req.query.department;
  }

  const users = await User.find(query).select("-password").sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Prevent accidental lock-out: admin can’t deactivate themselves.
  if (String(user._id) === String(req.user._id) && req.body.isActive === false) {
    throw new AppError("You cannot deactivate your own account", 400);
  }

  const allowed = ["name", "email", "role", "department", "phone", "enrollmentNumber", "employeeId", "isActive"];
  allowed.forEach((field) => {
    if (typeof req.body[field] !== "undefined") {
      user[field] = req.body[field];
    }
  });

  await user.save();

  const sanitized = user.toObject();
  delete sanitized.password;

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: sanitized
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (String(user._id) === String(req.user._id)) {
    throw new AppError("You cannot delete your own account", 400);
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "User deleted successfully"
  });
});

module.exports = {
  listUsers,
  updateUser,
  deleteUser
};
