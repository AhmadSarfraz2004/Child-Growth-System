// Import WeeklyRoutineRecord model to create, read, and delete weekly routine records
const WeeklyRoutineRecord = require("../models/WeeklyRoutineRecord");

// Import Child model to verify child ownership
const Child = require("../models/Child");

// Import GrowthRecord model to get latest growth status of child
const GrowthRecord = require("../models/GrowthRecord");

// Function to calculate average value from daily records
const calculateAverage = (dailyRecords, fieldName) => {
  // Add all values of the given field from daily records
  const total = dailyRecords.reduce((sum, record) => sum + Number(record[fieldName]), 0);

  // Divide total by number of daily records to get average
  const average = total / dailyRecords.length;

  // Return average rounded to 2 decimal places
  return Number(average.toFixed(2));
};

// @desc    Add weekly routine record for a child
// @route   POST /api/weekly-routines/:childId
// @access  Private
const addWeeklyRoutine = async (req, res) => {
  // Start try block to handle successful request
  try {
    // Extract childId from URL parameters
    const { childId } = req.params;

    // Extract weekStartDate, dailyRecords, progressStatus, and improvementPercentage from request body
    const { weekStartDate, dailyRecords, progressStatus, improvementPercentage } = req.body;

    // Check if child exists and belongs to logged-in parent
    const child = await Child.findOne({
      // Match child using childId from URL
      _id: childId,

      // Match parentId with logged-in user ID
      parentId: req.user._id,
    });

    // If child does not exist or does not belong to user, return error
    if (!child) {
      // Return not found response
      return res.status(404).json({
        // Mark request as failed
        success: false,

        // Send error message
        message: "Child not found",
      });
    }

    // Validate weekStartDate field
    if (!weekStartDate) {
      // Return validation error response
      return res.status(400).json({
        // Mark request as failed
        success: false,

        // Send validation message
        message: "Please provide week start date",
      });
    }

    // Validate dailyRecords array
    if (!dailyRecords || !Array.isArray(dailyRecords)) {
      // Return validation error response
      return res.status(400).json({
        // Mark request as failed
        success: false,

        // Send validation message
        message: "Please provide daily routine records as an array",
      });
    }

    // Check if exactly 7 daily records are provided
    if (dailyRecords.length !== 7) {
      // Return validation error response
      return res.status(400).json({
        // Mark request as failed
        success: false,

        // Send validation message
        message: "Please provide exactly 7 daily routine records",
      });
    }

    // Validate progressStatus field for temporary manual testing
    if (!progressStatus) {
      // Return validation error response
      return res.status(400).json({
        // Mark request as failed
        success: false,

        // Send validation message
        message: "Please provide progress status",
      });
    }

    // Find latest growth record of this child
    const latestGrowthRecord = await GrowthRecord.findOne({
      // Match growth records using childId
      childId,
    }).sort({
      // Sort newest record first
      createdAt: -1,
    });

    // If no growth record exists, weekly routine cannot be added
    if (!latestGrowthRecord) {
      // Return bad request response
      return res.status(400).json({
        // Mark request as failed
        success: false,

        // Send message explaining required previous step
        message: "Please add a growth record before adding weekly routine",
      });
    }

    // Store previous growth status from latest growth record
    const previousGrowthStatus = latestGrowthRecord.growthStatus;

    // Calculate average sleep hours from daily records
    const avgSleepHours = calculateAverage(dailyRecords, "sleepHours");

    // Calculate average diet score from daily records
    const avgDietScore = calculateAverage(dailyRecords, "dietScore");

    // Calculate average activity hours from daily records
    const avgActivityHours = calculateAverage(dailyRecords, "activityHours");

    // Calculate average screen time from daily records
    const avgScreenTime = calculateAverage(dailyRecords, "screenTime");

    // Calculate average water intake from daily records
    const avgWaterIntake = calculateAverage(dailyRecords, "waterIntake");

    // Create weekly routine record in database
    const weeklyRoutine = await WeeklyRoutineRecord.create({
      // Save child ID
      childId,

      // Save week start date
      weekStartDate,

      // Save previous growth status from latest growth record
      previousGrowthStatus,

      // Save complete 7 days routine records
      dailyRecords,

      // Save calculated average sleep hours
      avgSleepHours,

      // Save calculated average diet score
      avgDietScore,

      // Save calculated average activity hours
      avgActivityHours,

      // Save calculated average screen time
      avgScreenTime,

      // Save calculated average water intake
      avgWaterIntake,

      // Save progress status manually for now; later it will come from AI model
      progressStatus,

      // Save improvement percentage if provided, otherwise save null
      improvementPercentage: improvementPercentage || null,
    });

    // Return success response with saved weekly routine record
    return res.status(201).json({
      // Mark request as successful
      success: true,

      // Send success message
      message: "Weekly routine record added successfully",

      // Send saved weekly routine record
      weeklyRoutine,
    });
  } catch (error) {
    // Return server error response if something goes wrong
    return res.status(500).json({
      // Mark request as failed
      success: false,

      // Send general error message
      message: "Server error while adding weekly routine record",

      // Send actual error message for debugging
      error: error.message,
    });
  }
};

// @desc    Get weekly routine history of a child
// @route   GET /api/weekly-routines/:childId
// @access  Private
const getWeeklyRoutinesByChild = async (req, res) => {
  // Start try block to handle successful request
  try {
    // Extract childId from URL parameters
    const { childId } = req.params;

    // Check if child exists and belongs to logged-in parent
    const child = await Child.findOne({
      // Match child using childId from URL
      _id: childId,

      // Match parentId with logged-in user ID
      parentId: req.user._id,
    });

    // If child does not exist or does not belong to user, return error
    if (!child) {
      // Return not found response
      return res.status(404).json({
        // Mark request as failed
        success: false,

        // Send error message
        message: "Child not found",
      });
    }

    // Find all weekly routine records of this child
    const weeklyRoutines = await WeeklyRoutineRecord.find({
      // Match records using childId
      childId,
    }).sort({
      // Sort newest record first
      createdAt: -1,
    });

    // Return success response with weekly routine records
    return res.status(200).json({
      // Mark request as successful
      success: true,

      // Send total number of records
      count: weeklyRoutines.length,

      // Send weekly routine records
      weeklyRoutines,
    });
  } catch (error) {
    // Return server error response if something goes wrong
    return res.status(500).json({
      // Mark request as failed
      success: false,

      // Send general error message
      message: "Server error while fetching weekly routine records",

      // Send actual error message for debugging
      error: error.message,
    });
  }
};

// @desc    Get single weekly routine record
// @route   GET /api/weekly-routines/single/:id
// @access  Private
const getSingleWeeklyRoutine = async (req, res) => {
  // Start try block to handle successful request
  try {
    // Find weekly routine record by ID
    const weeklyRoutine = await WeeklyRoutineRecord.findById(req.params.id);

    // If weekly routine record does not exist, return error
    if (!weeklyRoutine) {
      // Return not found response
      return res.status(404).json({
        // Mark request as failed
        success: false,

        // Send error message
        message: "Weekly routine record not found",
      });
    }

    // Find child linked with this weekly routine record to verify ownership
    const child = await Child.findOne({
      // Match child using weekly routine childId
      _id: weeklyRoutine.childId,

      // Match parentId with logged-in user ID
      parentId: req.user._id,
    });

    // If child does not belong to logged-in user, deny access
    if (!child) {
      // Return forbidden response
      return res.status(403).json({
        // Mark request as failed
        success: false,

        // Send access denied message
        message: "Not authorized to access this weekly routine record",
      });
    }

    // Return success response with single weekly routine record
    return res.status(200).json({
      // Mark request as successful
      success: true,

      // Send weekly routine record
      weeklyRoutine,
    });
  } catch (error) {
    // Return server error response if something goes wrong
    return res.status(500).json({
      // Mark request as failed
      success: false,

      // Send general error message
      message: "Server error while fetching weekly routine record",

      // Send actual error message for debugging
      error: error.message,
    });
  }
};

// @desc    Delete weekly routine record
// @route   DELETE /api/weekly-routines/:id
// @access  Private
const deleteWeeklyRoutine = async (req, res) => {
  // Start try block to handle successful request
  try {
    // Find weekly routine record by ID
    const weeklyRoutine = await WeeklyRoutineRecord.findById(req.params.id);

    // If weekly routine record does not exist, return error
    if (!weeklyRoutine) {
      // Return not found response
      return res.status(404).json({
        // Mark request as failed
        success: false,

        // Send error message
        message: "Weekly routine record not found",
      });
    }

    // Find child linked with this weekly routine record to verify ownership
    const child = await Child.findOne({
      // Match child using weekly routine childId
      _id: weeklyRoutine.childId,

      // Match parentId with logged-in user ID
      parentId: req.user._id,
    });

    // If child does not belong to logged-in user, deny deletion
    if (!child) {
      // Return forbidden response
      return res.status(403).json({
        // Mark request as failed
        success: false,

        // Send access denied message
        message: "Not authorized to delete this weekly routine record",
      });
    }

    // Delete weekly routine record from database
    await weeklyRoutine.deleteOne();

    // Return success response after deletion
    return res.status(200).json({
      // Mark request as successful
      success: true,

      // Send success message
      message: "Weekly routine record deleted successfully",
    });
  } catch (error) {
    // Return server error response if something goes wrong
    return res.status(500).json({
      // Mark request as failed
      success: false,

      // Send general error message
      message: "Server error while deleting weekly routine record",

      // Send actual error message for debugging
      error: error.message,
    });
  }
};

// Export all controller functions
module.exports = {
  // Export add weekly routine function
  addWeeklyRoutine,

  // Export get weekly routines by child function
  getWeeklyRoutinesByChild,

  // Export get single weekly routine function
  getSingleWeeklyRoutine,

  // Export delete weekly routine function
  deleteWeeklyRoutine,
};