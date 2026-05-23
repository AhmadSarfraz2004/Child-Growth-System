// Import express package to create router
const express = require("express");

// Import recommendation controller functions
const {
  addRecommendationRecord,
  getRecommendationsByChild,
  getSingleRecommendationRecord,
  deleteRecommendationRecord,
} = require("../controllers/recommendationController");

// Import protect middleware to secure recommendation APIs
const { protect } = require("../middleware/authMiddleware");

// Create express router instance
const router = express.Router();

// Route for adding recommendation record and getting child recommendation history
router
  // Define route path with childId parameter
  .route("/:childId")

  // POST request creates a recommendation record for selected child
  .post(protect, addRecommendationRecord)

  // GET request gets all recommendation records of selected child
  .get(protect, getRecommendationsByChild);

// Route for getting one recommendation record by recommendation record ID
router
  // Define route path for single recommendation record
  .route("/single/:id")

  // GET request gets one recommendation record
  .get(protect, getSingleRecommendationRecord);

// Route for deleting one recommendation record by recommendation record ID
router
  // Define route path with recommendation record ID
  .route("/:id")

  // DELETE request deletes one recommendation record
  .delete(protect, deleteRecommendationRecord);

// Export router so server.js can use it
module.exports = router;