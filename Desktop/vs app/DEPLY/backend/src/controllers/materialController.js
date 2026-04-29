const fs = require("fs");
const path = require("path");
const Course = require("../models/Course");
const Material = require("../models/Material");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { buildUploadUrl } = require("../utils/url");

const canAccessCourse = async (courseId, user) => {
  const course = await Course.findById(courseId).select("lecturer students");
  if (!course) return { allowed: false, course: null };

  if (user.role === "admin") return { allowed: true, course };
  if (String(course.lecturer) === String(user._id)) return { allowed: true, course };
  const isStudentEnrolled = course.students.some((id) => String(id) === String(user._id));
  return { allowed: isStudentEnrolled, course };
};

const createMaterial = asyncHandler(async (req, res) => {
  const { allowed } = await canAccessCourse(req.body.course, req.user);
  if (!allowed) {
    throw new AppError("You cannot add materials to this course", 403);
  }

  const fileUrl = req.files && req.files[0] 
    ? buildUploadUrl(req, req.files[0].filename)
    : req.body.fileUrl || "";

  const material = await Material.create({
    title: req.body.title,
    description: req.body.description,
    course: req.body.course,
    fileUrl,
    fileType: req.body.fileType || "pdf",
    uploadedBy: req.user._id
  });

  res.status(201).json({
    success: true,
    message: "Material created successfully",
    data: material
  });
});

const listMaterials = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.course) {
    const { allowed, course } = await canAccessCourse(req.query.course, req.user);
    if (!course) throw new AppError("Course not found", 404);
    if (!allowed) throw new AppError("You cannot access materials for this course", 403);
    filter.course = req.query.course;
  } else if (req.user.role === "student") {
    const enrolledCourseIds = await Course.find({ students: req.user._id }).distinct("_id");
    filter.course = { $in: enrolledCourseIds };
  }

  const materials = await Material.find(filter)
    .populate("uploadedBy", "name role")
    .populate("course", "title code")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: materials.length,
    data: materials
  });
});

const getMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id)
    .populate("uploadedBy", "name role")
    .populate("course", "title code lecturer students");

  if (!material) {
    throw new AppError("Material not found", 404);
  }

  const { allowed } = await canAccessCourse(material.course._id, req.user);
  if (!allowed) throw new AppError("You cannot access this material", 403);

  res.status(200).json({
    success: true,
    data: material
  });
});

const updateMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);

  if (!material) {
    throw new AppError("Material not found", 404);
  }

  const { allowed } = await canAccessCourse(material.course, req.user);
  if (!allowed) throw new AppError("You cannot update this material", 403);

  const allowedUpdates = ["title", "description", "fileUrl", "fileType", "course"];
  allowedUpdates.forEach((field) => {
    if (typeof req.body[field] !== "undefined") {
      material[field] = req.body[field];
    }
  });

  if (req.files && req.files[0]) {
    material.fileUrl = buildUploadUrl(req, req.files[0].filename);
  }

  if (req.body.course && String(req.body.course) !== String(material.course)) {
    const { allowed: newAllowed } = await canAccessCourse(req.body.course, req.user);
    if (!newAllowed) throw new AppError("You cannot move materials to that course", 403);
  }

  await material.save();

  res.status(200).json({
    success: true,
    message: "Material updated successfully",
    data: material
  });
});

const deleteMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);

  if (!material) {
    throw new AppError("Material not found", 404);
  }

  const { allowed } = await canAccessCourse(material.course, req.user);
  if (!allowed) throw new AppError("You cannot delete this material", 403);

  if (material.fileUrl) {
    const filename = material.fileUrl.split("/").pop();
    const filepath = path.join(__dirname, "..", "..", "uploads", filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  }

  await material.deleteOne();

  res.status(200).json({
    success: true,
    message: "Material deleted successfully"
  });
});

module.exports = {
  createMaterial,
  listMaterials,
  getMaterial,
  updateMaterial,
  deleteMaterial
};

