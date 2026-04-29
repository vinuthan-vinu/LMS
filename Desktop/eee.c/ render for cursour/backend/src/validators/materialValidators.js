const { body, param, query } = require("express-validator");

const materialCreateValidator = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("course").isMongoId().withMessage("Valid course id is required"),
  body("fileUrl").trim().notEmpty().withMessage("fileUrl is required"),
  body("fileType").optional().trim(),
  body("description").optional().trim()
];

const materialListValidator = [
  query("course").optional().isMongoId().withMessage("Valid course id is required")
];

const materialIdValidator = [param("id").isMongoId().withMessage("Valid material id is required")];

const materialUpdateValidator = [
  body("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
  body("description").optional().trim(),
  body("fileUrl").optional().trim().notEmpty().withMessage("fileUrl cannot be empty"),
  body("fileType").optional().trim(),
  body("course").optional().isMongoId().withMessage("Valid course id is required")
];

module.exports = {
  materialCreateValidator,
  materialListValidator,
  materialIdValidator,
  materialUpdateValidator
};

