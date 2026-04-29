const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    maxScore: {
      type: Number,
      default: 100
    },
    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "published"
    },
    attachments: [
      {
        type: String
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
