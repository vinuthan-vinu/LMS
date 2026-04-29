const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const Submission = require("../models/Submission");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { buildUploadUrl } = require("../utils/url");

const resolveAttachments = (req) =>
  (req.files || []).map(
    (file) => buildUploadUrl(req, file.filename)
  );

const ensureCourseWriteAccess = (course, user) => {
  const userRole = (user.role || "").toLowerCase();
  if (userRole === "admin") {
    return;
  }

  if (String(course.lecturer) !== String(user._id)) {
    throw new AppError("You cannot manage assignments for this course", 403);
  }
};

const createAssignment = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.body.course);

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  ensureCourseWriteAccess(course, req.user);

  const assignment = await Assignment.create({
    ...req.body,
    attachments: resolveAttachments(req),
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    message: "Assignment created successfully",
    data: assignment
  });
});

const listAssignments = asyncHandler(async (req, res) => {
  const query = {};

  if (req.query.courseId) {
    query.course = req.query.courseId;
  }

  if (req.user.role === "student") {
    const enrolledCourseIds = await Course.find({ students: req.user._id }).distinct("_id");
    query.course = { $in: enrolledCourseIds };
    query.status = "published";
  }

  const assignments = await Assignment.find(query)
    .populate({
      path: "course",
      select: "title code lecturer students"
    })
    .populate("createdBy", "name email")
    .sort({ dueDate: 1 });

  const filteredAssignments = assignments;

  res.status(200).json({
    success: true,
    count: filteredAssignments.length,
    data: filteredAssignments
  });
});

const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate("course", "title code lecturer students")
    .populate("createdBy", "name email");

  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  res.status(200).json({
    success: true,
    data: assignment
  });
});

const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).populate("course");

  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  ensureCourseWriteAccess(assignment.course, req.user);

  const updates = {
    ...req.body
  };

  if ((req.files || []).length > 0) {
    updates.attachments = resolveAttachments(req);
  }

  const updatedAssignment = await Assignment.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: "Assignment updated successfully",
    data: updatedAssignment
  });
});

const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).populate("course");

  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  ensureCourseWriteAccess(assignment.course, req.user);

  await Submission.deleteMany({ assignment: assignment._id });
  await assignment.deleteOne();

  res.status(200).json({
    success: true,
    message: "Assignment deleted successfully"
  });
});

module.exports = {
  createAssignment,
  listAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment
};
