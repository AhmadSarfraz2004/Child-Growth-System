// Import RecommendationRecord model to create, read, and delete recommendation records
const RecommendationRecord = require("../models/RecommendationRecord");

// Import Child model to verify that the child belongs to the logged-in parent
const Child = require("../models/Child");

// Import GrowthRecord model to verify growth record ownership if growthRecordId is provided
const GrowthRecord = require("../models/GrowthRecord");

// Import WeeklyRoutineRecord model to verify weekly routine ownership if weeklyRoutineId is provided
const WeeklyRoutineRecord = require("../models/WeeklyRoutineRecord");

// @desc    Add recommendation record for a child
// @route   POST /api/recommendations/:childId
// @access  Private
const addRecommendationRecord = async (req, res) => {
  // Start try block to handle successful request
  try {
    // Extract childId from request URL parameters
    const { childId } = req.params;

    // Extract recommendation data from request body
    const { growthRecordId, weeklyRoutineId, recommendations } = req.body;

    // Find child and make sure it belongs to the logged-in parent
    const child = await Child.findOne({
      // Match child using childId from URL
      _id: childId,

      // Match child parentId with logged-in user ID
      parentId: req.user._id,
    });

    // Check if child was not found
    if (!child) {
      // Return not found response
      return res.status(404).json({
        // Mark request as failed
        success: false,

        // Send error message
        message: "Child not found",
      });
    }

    // Validate that recommendations are provided as an array
    if (!recommendations || !Array.isArray(recommendations)) {
      // Return validation error response
      return res.status(400).json({
        // Mark request as failed
        success: false,

        // Send validation message
        message: "Please provide recommendations as an array",
      });
    }

    // Validate that at least one recommendation exists
    if (recommendations.length === 0) {
      // Return validation error response
      return res.status(400).json({
        // Mark request as failed
        success: false,

        // Send validation message
        message: "Please provide at least one recommendation",
      });
    }

    // If growthRecordId is provided, verify that growth record belongs to this child
    if (growthRecordId) {
      // Find growth record by growthRecordId and childId
      const growthRecord = await GrowthRecord.findOne({
        // Match growth record by ID
        _id: growthRecordId,

        // Match growth record childId with selected child
        childId,
      });

      // Check if growth record was not found
      if (!growthRecord) {
        // Return not found response
        return res.status(404).json({
          // Mark request as failed
          success: false,

          // Send error message
          message: "Growth record not found for this child",
        });
      }
    }

    // If weeklyRoutineId is provided, verify that weekly routine record belongs to this child
    if (weeklyRoutineId) {
      // Find weekly routine record by weeklyRoutineId and childId
      const weeklyRoutine = await WeeklyRoutineRecord.findOne({
        // Match weekly routine record by ID
        _id: weeklyRoutineId,

        // Match weekly routine childId with selected child
        childId,
      });

      // Check if weekly routine record was not found
      if (!weeklyRoutine) {
        // Return not found response
        return res.status(404).json({
          // Mark request as failed
          success: false,

          // Send error message
          message: "Weekly routine record not found for this child",
        });
      }
    }

    // Create recommendation record in database
    const recommendationRecord = await RecommendationRecord.create({
      // Save child ID
      childId,

      // Save growth record ID if provided, otherwise save null
      growthRecordId: growthRecordId || null,

      // Save weekly routine ID if provided, otherwise save null
      weeklyRoutineId: weeklyRoutineId || null,

      // Save recommendations array
      recommendations,
    });

    // Return success response with created recommendation record
    return res.status(201).json({
      // Mark request as successful
      success: true,

      // Send success message
      message: "Recommendation record added successfully",

      // Send created recommendation record
      recommendationRecord,
    });
  } catch (error) {
    // Return server error response if something goes wrong
    return res.status(500).json({
      // Mark request as failed
      success: false,

      // Send general error message
      message: "Server error while adding recommendation record",

      // Send actual error message for debugging
      error: error.message,
    });
  }
};

// @desc    Get all recommendation records of a child
// @route   GET /api/recommendations/:childId
// @access  Private
const getRecommendationsByChild = async (req, res) => {
  // Start try block to handle successful request
  try {
    // Extract childId from request URL parameters
    const { childId } = req.params;

    // Find child and make sure it belongs to the logged-in parent
    const child = await Child.findOne({
      // Match child using childId from URL
      _id: childId,

      // Match child parentId with logged-in user ID
      parentId: req.user._id,
    });

    // Check if child was not found
    if (!child) {
      // Return not found response
      return res.status(404).json({
        // Mark request as failed
        success: false,

        // Send error message
        message: "Child not found",
      });
    }

    // Find all recommendation records of this child and sort latest first
    const recommendationRecords = await RecommendationRecord.find({
      // Match recommendation records using childId
      childId,
    }).sort({
      // Sort newest records first
      createdAt: -1,
    });

    // Return success response with recommendation records
    return res.status(200).json({
      // Mark request as successful
      success: true,

      // Send total number of recommendation records
      count: recommendationRecords.length,

      // Send recommendation records array
      recommendationRecords,
    });
  } catch (error) {
    // Return server error response if something goes wrong
    return res.status(500).json({
      // Mark request as failed
      success: false,

      // Send general error message
      message: "Server error while fetching recommendation records",

      // Send actual error message for debugging
      error: error.message,
    });
  }
};

// @desc    Get single recommendation record
// @route   GET /api/recommendations/single/:id
// @access  Private
const getSingleRecommendationRecord = async (req, res) => {
  // Start try block to handle successful request
  try {
    // Find recommendation record by its ID
    const recommendationRecord = await RecommendationRecord.findById(req.params.id);

    // Check if recommendation record was not found
    if (!recommendationRecord) {
      // Return not found response
      return res.status(404).json({
        // Mark request as failed
        success: false,

        // Send error message
        message: "Recommendation record not found",
      });
    }

    // Find child linked with recommendation record to verify ownership
    const child = await Child.findOne({
      // Match child using recommendation record childId
      _id: recommendationRecord.childId,

      // Match child parentId with logged-in user ID
      parentId: req.user._id,
    });

    // If child does not belong to logged-in user, deny access
    if (!child) {
      // Return forbidden response
      return res.status(403).json({
        // Mark request as failed
        success: false,

        // Send access denied message
        message: "Not authorized to access this recommendation record",
      });
    }

    // Return success response with recommendation record
    return res.status(200).json({
      // Mark request as successful
      success: true,

      // Send single recommendation record
      recommendationRecord,
    });
  } catch (error) {
    // Return server error response if something goes wrong
    return res.status(500).json({
      // Mark request as failed
      success: false,

      // Send general error message
      message: "Server error while fetching recommendation record",

      // Send actual error message for debugging
      error: error.message,
    });
  }
};

// @desc    Delete recommendation record
// @route   DELETE /api/recommendations/:id
// @access  Private
const deleteRecommendationRecord = async (req, res) => {
  // Start try block to handle successful request
  try {
    // Find recommendation record by its ID
    const recommendationRecord = await RecommendationRecord.findById(req.params.id);

    // Check if recommendation record was not found
    if (!recommendationRecord) {
      // Return not found response
      return res.status(404).json({
        // Mark request as failed
        success: false,

        // Send error message
        message: "Recommendation record not found",
      });
    }

    // Find child linked with recommendation record to verify ownership
    const child = await Child.findOne({
      // Match child using recommendation record childId
      _id: recommendationRecord.childId,

      // Match child parentId with logged-in user ID
      parentId: req.user._id,
    });

    // If child does not belong to logged-in user, deny delete
    if (!child) {
      // Return forbidden response
      return res.status(403).json({
        // Mark request as failed
        success: false,

        // Send access denied message
        message: "Not authorized to delete this recommendation record",
      });
    }

    // Delete recommendation record from database
    await recommendationRecord.deleteOne();

    // Return success response after deletion
    return res.status(200).json({
      // Mark request as successful
      success: true,

      // Send success message
      message: "Recommendation record deleted successfully",
    });
  } catch (error) {
    // Return server error response if something goes wrong
    return res.status(500).json({
      // Mark request as failed
      success: false,

      // Send general error message
      message: "Server error while deleting recommendation record",

      // Send actual error message for debugging
      error: error.message,
    });
  }
};

// Export controller functions so routes can use them
module.exports = {
  // Export add recommendation record function
  addRecommendationRecord,

  // Export get recommendations by child function
  getRecommendationsByChild,

  // Export get single recommendation record function
  getSingleRecommendationRecord,

  // Export delete recommendation record function
  deleteRecommendationRecord,
};