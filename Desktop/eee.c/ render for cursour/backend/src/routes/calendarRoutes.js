const express = require("express");
const { listEvents, upsertEvent, deleteEvent } = require("../controllers/calendarController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", listEvents);
router.post("/", authorize("admin"), upsertEvent);
router.delete("/:id", authorize("admin"), deleteEvent);

module.exports = router;
