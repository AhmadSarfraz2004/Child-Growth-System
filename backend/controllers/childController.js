const Child = require("../models/Child");

// @desc    Add new child
// @route   POST /api/children
// @access  Private
const addChild = async (req, res) => {
  try {
    const { name, gender, dateOfBirth } = req.body;

    if (!name || !gender || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, gender, and date of birth",
      });
    }

    const child = await Child.create({
      parentId: req.user._id,
      name,
      gender,
      dateOfBirth,
    });

    return res.status(201).json({
      success: true,
      message: "Child added successfully",
      child,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while adding child",
      error: error.message,
    });
  }
};

// @desc    Get all children of logged-in parent
// @route   GET /api/children
// @access  Private
const getMyChildren = async (req, res) => {
  try {
    const children = await Child.find({ parentId: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: children.length,
      children,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching children",
      error: error.message,
    });
  }
};

// @desc    Get single child by ID
// @route   GET /api/children/:id
// @access  Private
const getChildById = async (req, res) => {
  try {
    const child = await Child.findOne({
      _id: req.params.id,
      parentId: req.user._id,
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    return res.status(200).json({
      success: true,
      child,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while fetching child",
      error: error.message,
    });
  }
};

// @desc    Update child
// @route   PUT /api/children/:id
// @access  Private
const updateChild = async (req, res) => {
  try {
    const { name, gender, dateOfBirth } = req.body;

    const child = await Child.findOne({
      _id: req.params.id,
      parentId: req.user._id,
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    child.name = name || child.name;
    child.gender = gender || child.gender;
    child.dateOfBirth = dateOfBirth || child.dateOfBirth;

    const updatedChild = await child.save();

    return res.status(200).json({
      success: true,
      message: "Child updated successfully",
      child: updatedChild,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while updating child",
      error: error.message,
    });
  }
};

// @desc    Delete child
// @route   DELETE /api/children/:id
// @access  Private
const deleteChild = async (req, res) => {
  try {
    const child = await Child.findOne({
      _id: req.params.id,
      parentId: req.user._id,
    });

    if (!child) {
      return res.status(404).json({
        success: false,
        message: "Child not found",
      });
    }

    await child.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Child deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error while deleting child",
      error: error.message,
    });
  }
};

module.exports = {
  addChild,
  getMyChildren,
  getChildById,
  updateChild,
  deleteChild,
};