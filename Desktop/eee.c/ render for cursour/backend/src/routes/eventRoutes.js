const express = require("express");
const { listEvents, createEvent, updateEvent, deleteEvent } = require("../controllers/eventController");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.use(protect);

router.get("/", listEvents);
router.post("/", authorize("admin"), upload.array("files", 1), createEvent);
router.patch("/:id", authorize("admin"), upload.array("files", 1), updateEvent);
router.delete("/:id", authorize("admin"), deleteEvent);

module.exports = router;
