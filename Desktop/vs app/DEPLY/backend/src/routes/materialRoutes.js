const express = require("express");

const { authorize, protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  createMaterial,
  deleteMaterial,
  getMaterial,
  listMaterials,
  updateMaterial
} = require("../controllers/materialController");
const {
  materialCreateValidator,
  materialIdValidator,
  materialListValidator,
  materialUpdateValidator
} = require("../validators/materialValidators");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(materialListValidator, validate, listMaterials)
  .post(authorize("lecturer", "admin"), materialCreateValidator, validate, createMaterial);

router
  .route("/:id")
  .get(materialIdValidator, validate, getMaterial)
  .patch(authorize("lecturer", "admin"), materialIdValidator, materialUpdateValidator, validate, updateMaterial)
  .delete(authorize("lecturer", "admin"), materialIdValidator, validate, deleteMaterial);

module.exports = router;

