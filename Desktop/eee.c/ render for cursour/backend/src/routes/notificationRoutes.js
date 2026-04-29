const express = require("express");

const {
  createNotification,
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  updateNotification
} = require("../controllers/notificationController");
const { authorize, protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  notificationIdValidator,
  notificationUpdateValidator,
  notificationValidator
} = require("../validators/notificationValidators");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(listNotifications)
  .post(authorize("lecturer", "admin"), notificationValidator, validate, createNotification);

router.post("/mark-all-read", markAllNotificationsRead);

router
  .route("/:id")
  .patch(notificationIdValidator, notificationUpdateValidator, validate, updateNotification)
  .delete(notificationIdValidator, validate, deleteNotification);

module.exports = router;
