const fs = require("fs");
const path = require("path");
const Event = require("../models/Event");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { buildUploadUrl } = require("../utils/url");

const listEvents = asyncHandler(async (req, res) => {
  const events = await Event.find().sort({ dateTime: 1 });
  res.status(200).json({
    success: true,
    data: events
  });
});

const createEvent = asyncHandler(async (req, res) => {
  const imageUrl = req.files && req.files[0] 
    ? buildUploadUrl(req, req.files[0].filename)
    : "";

  const event = await Event.create({
    ...req.body,
    image: imageUrl,
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    data: event
  });
});

const updateEvent = asyncHandler(async (req, res) => {
  let event = await Event.findById(req.params.id);
  if (!event) throw new AppError("Event not found", 404);

  const updateData = { ...req.body };
  if (req.files && req.files[0]) {
    updateData.image = buildUploadUrl(req, req.files[0].filename);
  }

  event = await Event.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: event
  });
});

const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new AppError("Event not found", 404);
  
  if (event.image) {
    const filename = event.image.split("/").pop();
    const filepath = path.join(__dirname, "..", "..", "uploads", filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  }

  await event.deleteOne();
  res.status(200).json({
    success: true,
    message: "Event deleted"
  });
});

module.exports = {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent
};
