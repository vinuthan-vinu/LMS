const CalendarEvent = require("../models/CalendarEvent");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const getUtcDayBounds = (rawDate) => {
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError("Invalid calendar date", 400);
  }

  const start = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
};

const listEvents = asyncHandler(async (req, res) => {
  const events = await CalendarEvent.find().sort({ date: 1 });
  res.status(200).json({
    success: true,
    data: events
  });
});

const upsertEvent = asyncHandler(async (req, res) => {
  const { date, title, type } = req.body;
  if (!date || !type) throw new AppError("Date and type are required", 400);
  if (!["leave", "event", "poya"].includes(type)) throw new AppError("Invalid calendar type", 400);
  
  let color = "#ef4444"; // default red
  if (type === "event") color = "#eab308"; // yellow
  if (type === "poya") color = "#22c55e"; // green

  const { start, end } = getUtcDayBounds(date);

  let event = await CalendarEvent.findOne({
    date: { $gte: start, $lt: end }
  });

  if (event) {
    event.title = String(title || type).trim();
    event.type = type;
    event.color = color;
    await event.save();
  } else {
    event = await CalendarEvent.create({
      date: start,
      title: String(title || type).trim(),
      type,
      color,
      createdBy: req.user._id
    });
  }

  res.status(200).json({
    success: true,
    data: event
  });
});

const deleteEvent = asyncHandler(async (req, res) => {
  const event = await CalendarEvent.findById(req.params.id);
  if (!event) throw new AppError("Event not found", 404);
  
  await event.deleteOne();
  res.status(200).json({
    success: true,
    message: "Event deleted"
  });
});

module.exports = {
  listEvents,
  upsertEvent,
  deleteEvent
};
