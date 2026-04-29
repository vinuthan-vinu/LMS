const { body, param } = require("express-validator");

const submissionCreateValidator = [
  body("assignment").notEmpty().withMessage("Assignment selection is required"),
  body("content").optional().trim()
];

const submissionUpdateValidator = [
  param("id").isMongoId().withMessage("Valid submission id is required"),
  body("content").optional().trim().notEmpty().withMessage("Content cannot be empty"),
  body("grade").optional().isFloat({ min: 0 }).withMessage("Grade must be a positive number"),
  body("feedback").optional().isString().withMessage("Feedback must be a string")
];

module.exports = {
  submissionCreateValidator,
  submissionUpdateValidator
};
