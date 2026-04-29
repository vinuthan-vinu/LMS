const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const Notification = require("../models/Notification");
const Submission = require("../models/Submission");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

const getDashboardSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const baseNotificationQuery = {
    $or: [
      { recipient: req.user._id },
      { targetRole: req.user.role },
      { targetRole: "all" }
    ]
  };

  let stats = {};

  if (req.user.role === "student") {
    stats = {
      enrolledCourses: await Course.countDocuments({ students: req.user._id }),
      activeAssignments: await Assignment.countDocuments({ status: "published" }),
      mySubmissions: await Submission.countDocuments({ student: req.user._id }),
      unreadNotifications: await Notification.countDocuments({
        ...baseNotificationQuery,
        readBy: { $ne: req.user._id }
      })
    };
  }

  if (req.user.role === "lecturer") {
    const lecturerCourses = await Course.find({ lecturer: req.user._id }).select("_id");
    const courseIds = lecturerCourses.map((course) => course._id);
    stats = {
      managingCourses: courseIds.length,
      publishedAssignments: await Assignment.countDocuments({ course: { $in: courseIds } }),
      pendingGrading: await Submission.countDocuments({
        course: { $in: courseIds },
        status: { $ne: "graded" }
      }),
      unreadNotifications: await Notification.countDocuments({
        ...baseNotificationQuery,
        readBy: { $ne: req.user._id }
      })
    };
  }

  if (req.user.role === "admin") {
    stats = {
      totalUsers: await User.countDocuments(),
      totalCourses: await Course.countDocuments(),
      totalAssignments: await Assignment.countDocuments(),
      totalSubmissions: await Submission.countDocuments()
    };
  }

  const upcomingAssignmentsQuery = {
    status: "published"
  };

  if (req.user.role === "student") {
    const studentCourseIds = await Course.find({ students: req.user._id }).distinct("_id");
    upcomingAssignmentsQuery.course = { $in: studentCourseIds };
  } else {
    upcomingAssignmentsQuery.dueDate = { $gte: now };
  }

  const upcomingAssignments = await Assignment.find(upcomingAssignmentsQuery)
    .populate("course", "title code students lecturer")
    .sort({ dueDate: 1 })
    .limit(5);

  const recentNotifications = await Notification.find(baseNotificationQuery)
    .sort({ createdAt: -1 })
    .limit(5);

  let recentSubmissions = [];
  if (req.user.role === "admin" || req.user.role === "lecturer") {
    const submissionQuery = {};

    if (req.user.role === "lecturer") {
      const lecturerCourseIds = await Course.find({ lecturer: req.user._id }).distinct("_id");
      submissionQuery.course = { $in: lecturerCourseIds };
    }

    recentSubmissions = await Submission.find(submissionQuery)
      .populate("assignment", "title dueDate maxScore")
      .populate("course", "title code")
      .populate("student", "name email")
      .sort({ submittedAt: -1, createdAt: -1 })
      .limit(5);
  }

  const scopedAssignments =
    req.user.role === "lecturer"
      ? upcomingAssignments.filter((assignment) => String(assignment.course.lecturer) === String(req.user._id))
      : upcomingAssignments;

  res.status(200).json({
    success: true,
    data: {
      stats,
      upcomingAssignments: scopedAssignments,
      recentSubmissions,
      notifications: recentNotifications.map((notification) => ({
        ...notification.toObject(),
        isRead: notification.readBy.some((readerId) => String(readerId) === String(req.user._id))
      }))
    }
  });
});

module.exports = {
  getDashboardSummary
};
