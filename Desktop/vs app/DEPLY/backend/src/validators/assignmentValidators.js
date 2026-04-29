const { body, param } = require("express-validator");

const assignmentValidator = [
  body("title").trim().notEmpty().withMessage("Assignment title is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("course").isMongoId().withMessage("Valid course id is required"),
  body("dueDate").isISO8601().withMessage("Valid due date is required"),
  body("maxScore").optional().isInt({ min: 1 }).withMessage("Max score must be positive"),
  body("status").optional().isIn(["draft", "published", "closed"]).withMessage("Invalid status")
];

const assignmentIdValidator = [param("id").isMongoId().withMessage("Valid assignment id is required")];

module.exports = {
  assignmentValidator,
  assignmentIdValidator
};
