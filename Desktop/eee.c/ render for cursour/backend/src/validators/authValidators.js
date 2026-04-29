const { body } = require("express-validator");
const studentEmailPattern = /^it\d{8}@my\.sliit\.lk$/i;

const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("email").custom((value) => {
    if (!studentEmailPattern.test(value)) {
      throw new Error("Email must be like it12345678@my.sliit.lk");
    }
    return true;
  }),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("department").optional().trim()
];

const loginValidator = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .bail()
    .matches(studentEmailPattern)
    .withMessage("Email must be like it12345678@my.sliit.lk"),
  body("password").notEmpty().withMessage("Password is required")
];

const profileValidator = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("phone").optional().isLength({ min: 10 }).withMessage("Phone is too short")
];

module.exports = {
  registerValidator,
  loginValidator,
  profileValidator
};
