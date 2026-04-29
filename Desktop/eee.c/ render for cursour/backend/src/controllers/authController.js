const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  phone: user.phone,
  avatar: user.avatar,
  enrollmentNumber: user.enrollmentNumber,
  employeeId: user.employeeId
});

const buildAuthResponse = (user) => ({
  token: generateToken(user),
  user: buildUserPayload(user)
});

const register = asyncHandler(async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email });

  if (existingUser) {
    throw new AppError("Email is already registered", 400);
  }

  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    department: req.body.department || "",
    role: "student"
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: buildAuthResponse(user)
  });
});

const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new AppError("Invalid email or password", 401);
  }

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: buildAuthResponse(user)
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: buildUserPayload(req.user)
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "department", "phone", "avatar", "enrollmentNumber", "employeeId"];
  const updates = {};

  allowedFields.forEach((field) => {
    if (typeof req.body[field] !== "undefined") {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true
  }).select("-password");

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: buildUserPayload(user)
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email, currentPassword, newPassword, confirmPassword } = req.body;

  if (!email || !currentPassword || !newPassword || !confirmPassword) {
    throw new AppError("Please provide email, current password, and new password", 400);
  }

  if (newPassword !== confirmPassword) {
    throw new AppError("Passwords do not match", 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new AppError("Current password is incorrect", 401);
  }

  if (currentPassword === newPassword) {
    throw new AppError("New password must be different from current password", 400);
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password has been reset successfully"
  });
});

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  forgotPassword
};
