const express = require("express");

const {
  createCourse,
  deleteCourse,
  getCourseById,
  listCourses,
  toggleEnrollment,
  updateCourse
} = require("../controllers/courseController");
const { authorize, protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const validate = require("../middleware/validate");
const { courseIdValidator, courseValidator } = require("../validators/courseValidators");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(listCourses)
  .post(
    authorize("lecturer", "admin"),
    upload.fields([{ name: "coverImage", maxCount: 1 }]),
    courseValidator,
    validate,
    createCourse
  );

router.post("/:id/enroll", authorize("student", "admin"), courseIdValidator, validate, toggleEnrollment);

router
  .route("/:id")
  .get(courseIdValidator, validate, getCourseById)
  .patch(
    authorize("lecturer", "admin"),
    upload.fields([{ name: "coverImage", maxCount: 1 }]),
    courseIdValidator,
    validate,
    updateCourse
  )
  .delete(authorize("lecturer", "admin"), courseIdValidator, validate, deleteCourse);

module.exports = router;
