const express = require("express");

const {
  createAssignment,
  deleteAssignment,
  getAssignmentById,
  listAssignments,
  updateAssignment
} = require("../controllers/assignmentController");
const { authorize, protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const validate = require("../middleware/validate");
const { assignmentIdValidator, assignmentValidator } = require("../validators/assignmentValidators");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(listAssignments)
  .post(authorize("lecturer", "admin"), upload.array("files", 5), assignmentValidator, validate, createAssignment);

router
  .route("/:id")
  .get(assignmentIdValidator, validate, getAssignmentById)
  .patch(
    authorize("lecturer", "admin"),
    upload.array("files", 5),
    assignmentIdValidator,
    validate,
    updateAssignment
  )
  .delete(authorize("lecturer", "admin"), assignmentIdValidator, validate, deleteAssignment);

module.exports = router;
