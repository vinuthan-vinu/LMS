const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    department: {
      type: String,
      required: true
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    credits: {
      type: Number,
      required: true,
      min: 1,
      max: 8
    },
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    coverImage: {
      type: String,
      default: ""
    },
    isActive: {
      type: Boolean,
      default: true
    },
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

module.exports = mongoose.model("Course", courseSchema);
