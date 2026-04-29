const { body, param } = require("express-validator");

const courseValidator = [
  body("title").trim().notEmpty().withMessage("Course title is required"),
  body("code").trim().notEmpty().withMessage("Course code is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("department").trim().notEmpty().withMessage("Department is required"),
  body("semester").isInt({ min: 1, max: 12 }).withMessage("Semester must be between 1 and 12"),
  body("credits").isInt({ min: 1, max: 8 }).withMessage("Credits must be between 1 and 8"),
  body("lecturer").isMongoId().withMessage("Valid lecturer is required")
];

const courseIdValidator = [param("id").isMongoId().withMessage("Valid course id is required")];

module.exports = {
  courseValidator,
  courseIdValidator
};
