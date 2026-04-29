const express = require("express");

const { getCurrentUser, login, register, updateProfile, forgotPassword } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { loginValidator, profileValidator, registerValidator } = require("../validators/authValidators");

const router = express.Router();

router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.post("/forgot-password", forgotPassword);
router.get("/me", protect, getCurrentUser);
router.patch("/profile", protect, profileValidator, validate, updateProfile);

module.exports = router;
