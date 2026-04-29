const asyncHandler = require("../utils/asyncHandler");
const { buildUploadUrl } = require("../utils/url");

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "File is required"
    });
  }

  const fileUrl = buildUploadUrl(req, req.file.filename);

  return res.status(201).json({
    success: true,
    message: "File uploaded successfully",
    data: {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: fileUrl
    }
  });
});

module.exports = {
  uploadFile
};
