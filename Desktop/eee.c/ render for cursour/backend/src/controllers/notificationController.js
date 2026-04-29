const Notification = require("../models/Notification");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const createNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.create({
    ...req.body,
    readBy: [],
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    message: "Notification created successfully",
    data: notification
  });
});

const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    $or: [
      { recipient: req.user._id },
      { targetRole: req.user.role },
      { targetRole: "all" }
    ]
  })
    .populate("createdBy", "name role")
    .populate("course", "title code")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications.map((notification) => ({
      ...notification.toObject(),
      isRead: notification.readBy.some((readerId) => String(readerId) === String(req.user._id))
    }))
  });
});

const updateNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  const isOwner = String(notification.createdBy) === String(req.user._id);
  const isRecipient = !notification.recipient || String(notification.recipient) === String(req.user._id);

  if (!isOwner && !isRecipient && req.user.role !== "admin") {
    throw new AppError("You cannot update this notification", 403);
  }

  const allowedUpdates =
    isOwner || req.user.role === "admin"
      ? ["title", "message", "type", "targetRole", "course", "recipient", "link"]
      : [];

  allowedUpdates.forEach((field) => {
    if (typeof req.body[field] !== "undefined") {
      notification[field] = req.body[field];
    }
  });

  if (req.body.isRead === true) {
    const alreadyRead = notification.readBy.some((readerId) => String(readerId) === String(req.user._id));
    if (!alreadyRead) {
      notification.readBy.push(req.user._id);
    }
    notification.readAt = new Date();
    notification.isRead = true;
  }

  await notification.save();

  res.status(200).json({
    success: true,
    message: "Notification updated successfully",
    data: notification
  });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  if (String(notification.createdBy) !== String(req.user._id) && req.user.role !== "admin") {
    throw new AppError("You cannot delete this notification", 403);
  }

  await notification.deleteOne();

  res.status(200).json({
    success: true,
    message: "Notification deleted successfully"
  });
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    $or: [
      { recipient: req.user._id },
      { targetRole: req.user.role },
      { targetRole: "all" }
    ],
    readBy: { $ne: req.user._id }
  });

  const now = new Date();
  await Promise.all(
    notifications.map(async (notification) => {
      notification.readBy.push(req.user._id);
      notification.isRead = true;
      notification.readAt = now;
      await notification.save();
    })
  );

  res.status(200).json({
    success: true,
    message: "All notifications marked as read",
    count: notifications.length
  });
});

module.exports = {
  createNotification,
  listNotifications,
  updateNotification,
  deleteNotification,
  markAllNotificationsRead
};
