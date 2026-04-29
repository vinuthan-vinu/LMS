const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const Submission = require("../models/Submission");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { buildUploadUrl } = require("../utils/url");

const canManageCourse = (course, user) => user.role === "admin" || String(course.lecturer) === String(user._id);

const createCourse = asyncHandler(async (req, res) => {
  const lecturer = await User.findById(req.body.lecturer);

  if (!lecturer || lecturer.role !== "lecturer") {
    throw new AppError("Valid lecturer is required", 400);
  }

  const course = await Course.create({
    ...req.body,
    createdBy: req.user._id,
    coverImage: req.files?.coverImage?.[0]
      ? buildUploadUrl(req, req.files.coverImage[0].filename)
      : req.body.coverImage || ""
  });

  res.status(201).json({
    success: true,
    message: "Course created successfully",
    data: course
  });
});

const listCourses = asyncHandler(async (req, res) => {
  const query = {};

  if (req.query.department) {
    query.department = req.query.department;
  }

  if (req.user.role === "student") {
    query.isActive = true;
  }

  if (req.user.role === "lecturer") {
    query.$or = [{ lecturer: req.user._id }, { students: req.user._id }];
  }

  const courses = await Course.find(query)
    .populate("lecturer", "name email department")
    .populate("students", "name email");

  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses
  });
});

const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate("lecturer", "name email department")
    .populate("students", "name email role");

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  res.status(200).json({
    success: true,
    data: course
  });
});

const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  if (!canManageCourse(course, req.user)) {
    throw new AppError("You cannot update this course", 403);
  }

  if (req.body.lecturer) {
    const lecturer = await User.findById(req.body.lecturer);
    if (!lecturer || lecturer.role !== "lecturer") {
      throw new AppError("Valid lecturer is required", 400);
    }
  }

  const updates = {
    ...req.body
  };

  if (req.files?.coverImage?.[0]) {
    updates.coverImage = buildUploadUrl(req, req.files.coverImage[0].filename);
  }

  const updatedCourse = await Course.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: "Course updated successfully",
    data: updatedCourse
  });
});

const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  if (!canManageCourse(course, req.user)) {
    throw new AppError("You cannot delete this course", 403);
  }

  await Assignment.deleteMany({ course: course._id });
  await Submission.deleteMany({ course: course._id });
  await course.deleteOne();

  res.status(200).json({
    success: true,
    message: "Course deleted successfully"
  });
});

const toggleEnrollment = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  const isEnrolled = course.students.some((studentId) => String(studentId) === String(req.user._id));

  if (isEnrolled) {
    course.students = course.students.filter((studentId) => String(studentId) !== String(req.user._id));
  } else {
    course.students.push(req.user._id);
  }

  await course.save();

  res.status(200).json({
    success: true,
    message: isEnrolled ? "Course unenrolled successfully" : "Course enrolled successfully",
    data: course
  });
});

module.exports = {
  createCourse,
  listCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  toggleEnrollment
};
