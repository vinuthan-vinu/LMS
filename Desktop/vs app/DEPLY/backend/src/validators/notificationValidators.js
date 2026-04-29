const { body, param } = require("express-validator");

const notificationValidator = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("message").trim().notEmpty().withMessage("Message is required"),
  body("type")
    .optional()
    .isIn(["info", "announcement", "assignment", "submission", "course", "system"])
    .withMessage("Invalid notification type"),
  body("targetRole")
    .optional()
    .isIn(["student", "lecturer", "admin", "all"])
    .withMessage("Invalid target role"),
  body("course").optional().isMongoId().withMessage("Valid course id is required"),
  body("recipient").optional().isMongoId().withMessage("Valid recipient id is required")
];

const notificationIdValidator = [param("id").isMongoId().withMessage("Valid notification id is required")];

const notificationUpdateValidator = [
  body("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
  body("message").optional().trim().notEmpty().withMessage("Message cannot be empty"),
  body("type")
    .optional()
    .isIn(["info", "announcement", "assignment", "submission", "course", "system"])
    .withMessage("Invalid notification type"),
  body("targetRole")
    .optional()
    .isIn(["student", "lecturer", "admin", "all"])
    .withMessage("Invalid target role"),
  body("course").optional().isMongoId().withMessage("Valid course id is required"),
  body("recipient").optional().isMongoId().withMessage("Valid recipient id is required"),
  body("isRead").optional().isBoolean().withMessage("isRead must be boolean")
];

module.exports = {
  notificationValidator,
  notificationIdValidator,
  notificationUpdateValidator
};
