// Import GrowthRecord model to create, read, and delete growth records
const GrowthRecord = require("../models/GrowthRecord");

// Import Child model to verify that the child belongs to the logged-in parent
const Child = require("../models/Child");

// Function to calculate BMI using weight and height
const calculateBMI = (weightKg, heightCm) => {
  // Convert height from centimeters to meters
  const heightM = heightCm / 100;

  // Calculate BMI using formula: weight / height²
  const bmi = weightKg / (heightM * heightM);

  // Return BMI rounded to 2 decimal places
  return Number(bmi.toFixed(2));
};

// @desc    Add growth record for a child
// @route   POST /api/growth-records/:childId
// @access  Private
const addGrowthRecord = async (req, res) => {
  // Start try block to handle successful operation
  try {
    // Extract childId from request parameters
    const { childId } = req.params;

    // Extract growth input fields from request body
    const {
      age,
      gender,
      heightCm,
      weightKg,
      sleepHours,
      dietScore,
      activityHours,
      screenTime,
      growthStatus,
      confidenceScore,
    } = req.body;

    // Check if child exists and belongs to the logged-in parent
    const child = await Child.findOne({
      // Match child by ID from URL
      _id: childId,

      // Match parentId with currently logged-in user ID
      parentId: req.user._id,
    });

    // If child is not found, return error response
    if (!child) {
      // Send 404 response when child does not exist or does not belong to user
      return res.status(404).json({
        // Indicate request failed
        success: false,

        // Send error message
        message: "Child not found",
      });
    }

    // Validate required fields before saving record
    if (
      // Check age field
      age === undefined ||

      // Check gender field
      !gender ||

      // Check height field
      heightCm === undefined ||

      // Check weight field
      weightKg === undefined ||

      // Check sleep hours field
      sleepHours === undefined ||

      // Check diet score field
      dietScore === undefined ||

      // Check activity hours field
      activityHours === undefined ||

      // Check screen time field
      screenTime === undefined ||

      // Check growth status field
      !growthStatus
    ) {
      // Return bad request response if any required field is missing
      return res.status(400).json({
        // Indicate request failed
        success: false,

        // Send validation error message
        message: "Please provide all required growth record fields",
      });
    }

    // Calculate BMI from weight and height
    const bmi = calculateBMI(weightKg, heightCm);

    // Create new growth record in database
    const growthRecord = await GrowthRecord.create({
      // Save child ID with this growth record
      childId,

      // Save child age
      age,

      // Save child gender
      gender,

      // Save child height in centimeters
      heightCm,

      // Save child weight in kilograms
      weightKg,

      // Save calculated BMI
      bmi,

      // Save sleep hours
      sleepHours,

      // Save diet score
      dietScore,

      // Save physical activity hours
      activityHours,

      // Save screen time
      screenTime,

      // Save growth status for now; later this will come from AI model
      growthStatus,

      // Save confidence score if available; otherwise save null
      confidenceScore: confidenceScore || null,
    });

    // Return success response with created growth record
    return res.status(201).json({
      // Indicate request succeeded
      success: true,

      // Send success message
      message: "Growth record added successfully",

      // Send created growth record
      growthRecord,
    });
  } catch (error) {
    // Return server error response if something goes wrong
    return res.status(500).json({
      // Indicate request failed
      success: false,

      // Send general error message
      message: "Server error while adding growth record",

      // Send actual error message for debugging
      error: error.message,
    });
  }
};

// @desc    Get all growth records of a child
// @route   GET /api/growth-records/:childId
// @access  Private
const getGrowthRecordsByChild = async (req, res) => {
  // Start try block to handle successful operation
  try {
    // Extract childId from request parameters
    const { childId } = req.params;

    // Check if child exists and belongs to the logged-in parent
    const child = await Child.findOne({
      // Match child by ID from URL
      _id: childId,

      // Match parentId with currently logged-in user ID
      parentId: req.user._id,
    });

    // If child is not found, return error response
    if (!child) {
      // Send 404 response when child does not exist or does not belong to user
      return res.status(404).json({
        // Indicate request failed
        success: false,

        // Send error message
        message: "Child not found",
      });
    }

    // Find all growth records of this child and sort newest first
    const growthRecords = await GrowthRecord.find({
      // Match records using childId
      childId,
    }).sort({
      // Sort latest records first
      createdAt: -1,
    });

    // Return success response with records
    return res.status(200).json({
      // Indicate request succeeded
      success: true,

      // Send total number of records
      count: growthRecords.length,

      // Send growth records array
      growthRecords,
    });
  } catch (error) {
    // Return server error response if something goes wrong
    return res.status(500).json({
      // Indicate request failed
      success: false,

      // Send general error message
      message: "Server error while fetching growth records",

      // Send actual error message for debugging
      error: error.message,
    });
  }
};

// @desc    Get single growth record by record ID
// @route   GET /api/growth-records/single/:id
// @access  Private
const getSingleGrowthRecord = async (req, res) => {
  // Start try block to handle successful operation
  try {
    // Find growth record by its ID
    const growthRecord = await GrowthRecord.findById(req.params.id);

    // If growth record does not exist, return error response
    if (!growthRecord) {
      // Send 404 response when record is not found
      return res.status(404).json({
        // Indicate request failed
        success: false,

        // Send error message
        message: "Growth record not found",
      });
    }

    // Find child of this growth record to verify ownership
    const child = await Child.findOne({
      // Match child by growth record's childId
      _id: growthRecord.childId,

      // Match parentId with currently logged-in user ID
      parentId: req.user._id,
    });

    // If child does not belong to logged-in user, deny access
    if (!child) {
      // Send forbidden response
      return res.status(403).json({
        // Indicate request failed
        success: false,

        // Send access denied message
        message: "Not authorized to access this growth record",
      });
    }

    // Return success response with single growth record
    return res.status(200).json({
      // Indicate request succeeded
      success: true,

      // Send growth record
      growthRecord,
    });
  } catch (error) {
    // Return server error response if something goes wrong
    return res.status(500).json({
      // Indicate request failed
      success: false,

      // Send general error message
      message: "Server error while fetching growth record",

      // Send actual error message for debugging
      error: error.message,
    });
  }
};

// @desc    Delete growth record by record ID
// @route   DELETE /api/growth-records/:id
// @access  Private
const deleteGrowthRecord = async (req, res) => {
  // Start try block to handle successful operation
  try {
    // Find growth record by its ID
    const growthRecord = await GrowthRecord.findById(req.params.id);

    // If growth record does not exist, return error response
    if (!growthRecord) {
      // Send 404 response when record is not found
      return res.status(404).json({
        // Indicate request failed
        success: false,

        // Send error message
        message: "Growth record not found",
      });
    }

    // Find child of this growth record to verify ownership
    const child = await Child.findOne({
      // Match child by growth record's childId
      _id: growthRecord.childId,

      // Match parentId with currently logged-in user ID
      parentId: req.user._id,
    });

    // If child does not belong to logged-in user, deny delete
    if (!child) {
      // Send forbidden response
      return res.status(403).json({
        // Indicate request failed
        success: false,

        // Send access denied message
        message: "Not authorized to delete this growth record",
      });
    }

    // Delete growth record from database
    await growthRecord.deleteOne();

    // Return success response after deletion
    return res.status(200).json({
      // Indicate request succeeded
      success: true,

      // Send success message
      message: "Growth record deleted successfully",
    });
  } catch (error) {
    // Return server error response if something goes wrong
    return res.status(500).json({
      // Indicate request failed
      success: false,

      // Send general error message
      message: "Server error while deleting growth record",

      // Send actual error message for debugging
      error: error.message,
    });
  }
};

// Export all controller functions
module.exports = {
  // Export add growth record function
  addGrowthRecord,

  // Export get growth records by child function
  getGrowthRecordsByChild,

  // Export get single growth record function
  getSingleGrowthRecord,

  // Export delete growth record function
  deleteGrowthRecord,
};