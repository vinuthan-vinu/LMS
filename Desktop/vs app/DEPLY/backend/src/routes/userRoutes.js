const express = require("express");

const { deleteUser, listUsers, updateUser } = require("../controllers/userController");
const { authorize, protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { userIdValidator, userUpdateValidator } = require("../validators/userValidators");

const router = express.Router();

router.get("/", protect, authorize("lecturer", "admin"), listUsers);
router.patch("/:id", protect, authorize("admin"), userIdValidator, userUpdateValidator, validate, updateUser);
router.delete("/:id", protect, authorize("admin"), userIdValidator, validate, deleteUser);

module.exports = router;
