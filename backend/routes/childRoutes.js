const express = require("express");

const {
  addChild,
  getMyChildren,
  getChildById,
  updateChild,
  deleteChild,
} = require("../controllers/childController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/")
  .post(protect, addChild)
  .get(protect, getMyChildren);

router.route("/:id")
  .get(protect, getChildById)
  .put(protect, updateChild)
  .delete(protect, deleteChild);

module.exports = router;