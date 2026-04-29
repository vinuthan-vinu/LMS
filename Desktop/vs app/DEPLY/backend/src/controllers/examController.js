const fs = require("fs");
const path = require("path");
const Exam = require("../models/Exam");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { buildUploadUrl } = require("../utils/url");

const listExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    data: exams
  });
});

const createExam = asyncHandler(async (req, res) => {
  const fileUrl = req.files && req.files[0] 
    ? buildUploadUrl(req, req.files[0].filename)
    : "";

  const exam = await Exam.create({
    ...req.body,
    fileUrl,
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    data: exam
  });
});

const updateExam = asyncHandler(async (req, res) => {
  let exam = await Exam.findById(req.params.id);
  if (!exam) throw new AppError("Exam notice not found", 404);

  const updateData = { ...req.body };
  if (req.files && req.files[0]) {
    updateData.fileUrl = buildUploadUrl(req, req.files[0].filename);
  }

  exam = await Exam.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: exam
  });
});

const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) throw new AppError("Exam notice not found", 404);
  
  if (exam.fileUrl) {
    const filename = exam.fileUrl.split("/").pop();
    const filepath = path.join(__dirname, "..", "..", "uploads", filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  }

  await exam.deleteOne();
  res.status(200).json({
    success: true,
    message: "Exam notice deleted"
  });
});

module.exports = {
  listExams,
  createExam,
  updateExam,
  deleteExam
};
