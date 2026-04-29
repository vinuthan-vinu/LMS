const mongoose = require("mongoose");

const calendarEventSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true // One type per day for simplicity
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["leave", "event", "poya"],
      required: true
    },
    color: {
      type: String,
      required: true
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

module.exports = mongoose.model("CalendarEvent", calendarEventSchema);
