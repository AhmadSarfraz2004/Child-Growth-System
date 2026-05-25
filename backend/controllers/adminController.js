// Import User model to count registered users
const User = require("../models/User");

// Import Child model to count child profiles
const Child = require("../models/Child");

// Import GrowthRecord model to count growth statuses
const GrowthRecord = require("../models/GrowthRecord");

// Import WeeklyRoutineRecord model to count weekly progress statuses
const WeeklyRoutineRecord = require("../models/WeeklyRoutineRecord");

// @desc    Get main admin dashboard statistics
// @route   GET /api/admin/dashboard-stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  // Start try block to handle successful request
  try {
    // Count total parent users only
    const totalParents = await User.countDocuments({ role: "parent" });

    // Count total admin users only
    const totalAdmins = await User.countDocuments({ role: "admin" });

    // Count total children profiles
    const totalChildren = await Child.countDocuments();

    // Count total growth records
    const totalGrowthRecords = await GrowthRecord.countDocuments();

    // Count total weekly routine records
    const totalWeeklyRoutineRecords = await WeeklyRoutineRecord.countDocuments();

    // Count children with Underdeveloped growth status
    const underdevelopedCount = await GrowthRecord.countDocuments({
      // Match growth status value
      growthStatus: "Underdeveloped",
    });

    // Count children with Normal Growth status
    const normalGrowthCount = await GrowthRecord.countDocuments({
      // Match growth status value
      growthStatus: "Normal Growth",
    });

    // Count children with Above Average status
    const aboveAverageCount = await GrowthRecord.countDocuments({
      // Match growth status value
      growthStatus: "Above Average",
    });

    // Count weekly records with Improving progress status
    const improvingCount = await WeeklyRoutineRecord.countDocuments({
      // Match progress status value
      progressStatus: "Improving",
    });

    // Count weekly records with No Significant Change progress status
    const noChangeCount = await WeeklyRoutineRecord.countDocuments({
      // Match progress status value
      progressStatus: "No Significant Change",
    });

    // Count weekly records with Getting Worse progress status
    const gettingWorseCount = await WeeklyRoutineRecord.countDocuments({
      // Match progress status value
      progressStatus: "Getting Worse",
    });

    // Return success response with dashboard statistics
    return res.status(200).json({
      // Mark request as successful
      success: true,

      // Send total users statistics
      users: {
        // Send total parent users
        totalParents,

        // Send total admin users
        totalAdmins,
      },

      // Send children and record statistics
      records: {
        // Send total child profiles
        totalChildren,

        // Send total growth records
        totalGrowthRecords,

        // Send total weekly routine records
        totalWeeklyRoutineRecords,
      },

      // Send growth status statistics
      growthStatusStats: {
        // Send Underdeveloped count
        underdeveloped: underdevelopedCount,

        // Send Normal Growth count
        normalGrowth: normalGrowthCount,

        // Send Above Average count
        aboveAverage: aboveAverageCount,
      },

      // Send weekly progress statistics
      progressStatusStats: {
        // Send Improving count
        improving: improvingCount,

        // Send No Significant Change count
        noSignificantChange: noChangeCount,

        // Send Getting Worse count
        gettingWorse: gettingWorseCount,
      },
    });
  } catch (error) {
    // Return server error response if something goes wrong
    return res.status(500).json({
      // Mark request as failed
      success: false,

      // Send general error message
      message: "Server error while fetching dashboard statistics",

      // Send actual error message for debugging
      error: error.message,
    });
  }
};

// @desc    Get growth status statistics only
// @route   GET /api/admin/growth-status-stats
// @access  Private/Admin
const getGrowthStatusStats = async (req, res) => {
  // Start try block to handle successful request
  try {
    // Use aggregation to group growth records by growthStatus
    const stats = await GrowthRecord.aggregate([
      // Group records by growthStatus
      {
        // Start group stage
        $group: {
          // Use growthStatus as group key
          _id: "$growthStatus",

          // Count total records in each group
          count: { $sum: 1 },
        },
      },

      // Sort results by count in descending order
      {
        // Start sort stage
        $sort: {
          // Sort highest count first
          count: -1,
        },
      },
    ]);

    // Return success response with growth status stats
    return res.status(200).json({
      // Mark request as successful
      success: true,

      // Send grouped growth status stats
      stats,
    });
  } catch (error) {
    // Return server error response if something goes wrong
    return res.status(500).json({
      // Mark request as failed
      success: false,

      // Send general error message
      message: "Server error while fetching growth status statistics",

      // Send actual error message for debugging
      error: error.message,
    });
  }
};

// @desc    Get weekly progress status statistics only
// @route   GET /api/admin/progress-status-stats
// @access  Private/Admin
const getProgressStatusStats = async (req, res) => {
  // Start try block to handle successful request
  try {
    // Use aggregation to group weekly records by progressStatus
    const stats = await WeeklyRoutineRecord.aggregate([
      // Group records by progressStatus
      {
        // Start group stage
        $group: {
          // Use progressStatus as group key
          _id: "$progressStatus",

          // Count total records in each group
          count: { $sum: 1 },
        },
      },

      // Sort results by count in descending order
      {
        // Start sort stage
        $sort: {
          // Sort highest count first
          count: -1,
        },
      },
    ]);

    // Return success response with progress status stats
    return res.status(200).json({
      // Mark request as successful
      success: true,

      // Send grouped progress status stats
      stats,
    });
  } catch (error) {
    // Return server error response if something goes wrong
    return res.status(500).json({
      // Mark request as failed
      success: false,

      // Send general error message
      message: "Server error while fetching progress status statistics",

      // Send actual error message for debugging
      error: error.message,
    });
  }
};

// Export admin controller functions
module.exports = {
  // Export dashboard stats function
  getDashboardStats,

  // Export growth status stats function
  getGrowthStatusStats,

  // Export progress status stats function
  getProgressStatusStats,
};