const { body, param } = require("express-validator");

const userIdValidator = [param("id").isMongoId().withMessage("Valid user id is required")];

const userUpdateValidator = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("email").optional().isEmail().withMessage("Valid email is required"),
  body("role").optional().isIn(["student", "lecturer", "admin"]).withMessage("Valid role is required"),
  body("department").optional().trim(),
  body("phone").optional().trim(),
  body("enrollmentNumber").optional().trim(),
  body("employeeId").optional().trim(),
  body("isActive").optional().isBoolean().withMessage("isActive must be boolean")
];

module.exports = {
  userIdValidator,
  userUpdateValidator
};

