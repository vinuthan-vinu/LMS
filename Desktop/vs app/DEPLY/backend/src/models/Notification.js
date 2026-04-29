const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ["info", "announcement", "assignment", "submission", "course", "system"],
      default: "info"
    },
    targetRole: {
      type: String,
      enum: ["student", "lecturer", "admin", "all"],
      default: "all"
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course"
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: Date,
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    link: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
