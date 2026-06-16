// Import express package to create router
const express = require("express");

// Import growth prediction and history controller functions
const {
  predictGrowth,
  getGrowthHistory,
  getGrowthHistoryByChild,
} = require("../controllers/growthController");

// Import protect middleware to secure the growth prediction API
const { protect } = require("../middleware/authMiddleware");

// Create express router instance
const router = express.Router();

// Route for predicting child growth status through the Python AI service
router
  // Define prediction route path
  .route("/predict")

  // POST request sends child growth input to AI service and returns prediction
  .post(protect, predictGrowth);

// Route for fetching all saved growth prediction records of logged-in user
router
  // Define history route path
  .route("/history")

  // GET request returns only records owned by the logged-in user
  .get(protect, getGrowthHistory);

// Route for fetching saved growth prediction records of one child
router
  // Define child-specific history route path
  .route("/history/:childId")

  // GET request returns records only if the child belongs to the logged-in user
  .get(protect, getGrowthHistoryByChild);

// Export router so it can be used in server.js
module.exports = router;
