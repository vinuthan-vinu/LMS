const express = require("express");

const {
  createSubmission,
  deleteSubmission,
  getSubmissionById,
  listSubmissions,
  updateSubmission
} = require("../controllers/submissionController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const validate = require("../middleware/validate");
const { submissionCreateValidator, submissionUpdateValidator } = require("../validators/submissionValidators");

const router = express.Router();

router.use(protect);

router.route("/").get(listSubmissions).post(upload.array("files", 5), submissionCreateValidator, validate, createSubmission);

router
  .route("/:id")
  .get(submissionUpdateValidator.slice(0, 1), validate, getSubmissionById)
  .patch(upload.array("files", 5), submissionUpdateValidator, validate, updateSubmission)
  .delete(submissionUpdateValidator.slice(0, 1), validate, deleteSubmission);

module.exports = router;
