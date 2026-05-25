// Import express package to create router
const express = require("express");

// Import admin controller functions
const {
  getDashboardStats,
  getGrowthStatusStats,
  getProgressStatusStats,
} = require("../controllers/adminController");

// Import protect and adminOnly middleware
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Create express router instance
const router = express.Router();

// Dashboard stats route for super admin
router.get(
  // Define dashboard statistics endpoint
  "/dashboard-stats",

  // First verify user token
  protect,

  // Then verify user role is admin
  adminOnly,

  // Then run dashboard stats controller
  getDashboardStats
);

// Growth status stats route for super admin
router.get(
  // Define growth status statistics endpoint
  "/growth-status-stats",

  // First verify user token
  protect,

  // Then verify user role is admin
  adminOnly,

  // Then run growth status stats controller
  getGrowthStatusStats
);

// Weekly progress status stats route for super admin
router.get(
  // Define progress status statistics endpoint
  "/progress-status-stats",

  // First verify user token
  protect,

  // Then verify user role is admin
  adminOnly,

  // Then run progress status stats controller
  getProgressStatusStats
);

// Export router so server.js can use it
module.exports = router;