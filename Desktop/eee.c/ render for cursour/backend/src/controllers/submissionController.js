const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { buildUploadUrl } = require("../utils/url");

const resolveAttachments = (req) =>
  (req.files || []).map(
    (file) => buildUploadUrl(req, file.filename)
  );

const listSubmissions = asyncHandler(async (req, res) => {
  const query = {};

  if (req.query.assignmentId) {
    query.assignment = req.query.assignmentId;
  }

  if (req.query.courseId) {
    query.course = req.query.courseId;
  }

  if (req.user.role === "student") {
    query.student = req.user._id;
  }

  const submissions = await Submission.find(query)
    .populate("assignment", "title dueDate maxScore")
    .populate("course", "title code lecturer")
    .populate("student", "name email")
    .populate("gradedBy", "name email")
    .sort({ updatedAt: -1 });

  const filteredSubmissions =
    req.user.role === "lecturer"
      ? submissions.filter((submission) => String(submission.course.lecturer) === String(req.user._id))
      : submissions;

  res.status(200).json({
    success: true,
    count: filteredSubmissions.length,
    data: filteredSubmissions
  });
});

const createSubmission = asyncHandler(async (req, res) => {
  if (req.user.role !== "student") {
    throw new AppError("Only students can create submissions", 403);
  }

  const assignment = await Assignment.findById(req.body.assignment).populate("course");

  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  const isEnrolled = assignment.course.students.some(
    (studentId) => String(studentId) === String(req.user._id)
  );

  if (!isEnrolled) {
    throw new AppError("Student is not enrolled in this course", 403);
  }

  const existingSubmission = await Submission.findOne({
    assignment: assignment._id,
    student: req.user._id
  });

  if (existingSubmission) {
    throw new AppError("Submission already exists for this assignment", 400);
  }

  const submission = await Submission.create({
    assignment: assignment._id,
    course: assignment.course._id,
    student: req.user._id,
    content: req.body.content,
    attachments: resolveAttachments(req),
    status: "submitted"
  });

  res.status(201).json({
    success: true,
    message: "Submission created successfully",
    data: submission
  });
});

const getSubmissionById = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id)
    .populate("assignment", "title description dueDate maxScore")
    .populate("course", "title code lecturer")
    .populate("student", "name email");

  if (!submission) {
    throw new AppError("Submission not found", 404);
  }

  if (
    req.user.role === "student" &&
    String(submission.student._id) !== String(req.user._id)
  ) {
    throw new AppError("You cannot view this submission", 403);
  }

  if (
    req.user.role === "lecturer" &&
    String(submission.course.lecturer) !== String(req.user._id)
  ) {
    throw new AppError("You cannot view this submission", 403);
  }

  res.status(200).json({
    success: true,
    data: submission
  });
});

const updateSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id)
    .populate("course", "lecturer")
    .populate("assignment", "maxScore");

  if (!submission) {
    throw new AppError("Submission not found", 404);
  }

  if (req.user.role === "student") {
    if (String(submission.student) !== String(req.user._id)) {
      throw new AppError("You cannot update this submission", 403);
    }

    if (submission.status === "graded") {
      throw new AppError("Graded submissions cannot be updated", 400);
    }

    submission.content = req.body.content || submission.content;
    if ((req.files || []).length > 0) {
      submission.attachments = resolveAttachments(req);
    }
    submission.status = "resubmitted";
    submission.submittedAt = new Date();
  } else if (
    req.user.role === "lecturer" ||
    req.user.role === "admin"
  ) {
    if (
      req.user.role === "lecturer" &&
      String(submission.course.lecturer) !== String(req.user._id)
    ) {
      throw new AppError("You cannot grade this submission", 403);
    }

    if (typeof req.body.grade !== "undefined") {
      submission.grade = Number(req.body.grade);
      if (submission.grade > submission.assignment.maxScore) {
        throw new AppError("Grade cannot exceed assignment max score", 400);
      }
      submission.status = "graded";
      submission.gradedAt = new Date();
      submission.gradedBy = req.user._id;
    }

    if (typeof req.body.feedback !== "undefined") {
      submission.feedback = req.body.feedback;
    }
  }

  await submission.save();

  res.status(200).json({
    success: true,
    message: "Submission updated successfully",
    data: submission
  });
});

const deleteSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id).populate("course", "lecturer");

  if (!submission) {
    throw new AppError("Submission not found", 404);
  }

  const canDelete =
    req.user.role === "admin" ||
    (req.user.role === "student" && String(submission.student) === String(req.user._id)) ||
    (req.user.role === "lecturer" && String(submission.course.lecturer) === String(req.user._id));

  if (!canDelete) {
    throw new AppError("You cannot delete this submission", 403);
  }

  await submission.deleteOne();

  res.status(200).json({
    success: true,
    message: "Submission deleted successfully"
  });
});

module.exports = {
  listSubmissions,
  createSubmission,
  getSubmissionById,
  updateSubmission,
  deleteSubmission
};
