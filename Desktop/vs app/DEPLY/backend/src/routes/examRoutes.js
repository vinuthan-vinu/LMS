const express = require("express");
const { listExams, createExam, updateExam, deleteExam } = require("../controllers/examController");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.use(protect);

router.get("/", listExams);
router.post("/", authorize("admin"), upload.array("files", 1), createExam);
router.patch("/:id", authorize("admin"), upload.array("files", 1), updateExam);
router.delete("/:id", authorize("admin"), deleteExam);

module.exports = router;
