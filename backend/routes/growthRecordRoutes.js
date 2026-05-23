// Import express to create router
const express = require("express");

// Import controller functions from growth record controller
const {
  addGrowthRecord,
  getGrowthRecordsByChild,
  getSingleGrowthRecord,
  deleteGrowthRecord,
} = require("../controllers/growthRecordController");

// Import protect middleware to secure routes
const { protect } = require("../middleware/authMiddleware");

// Create express router instance
const router = express.Router();

// Route for adding a growth record and getting growth history of a child
router
  // Define route path with childId parameter
  .route("/:childId")

  // POST request adds a new growth record for selected child
  .post(protect, addGrowthRecord)

  // GET request gets all growth records of selected child
  .get(protect, getGrowthRecordsByChild);

// Route for getting one specific growth record by record ID
router
  // Define route path for single growth record
  .route("/single/:id")

  // GET request gets one growth record
  .get(protect, getSingleGrowthRecord);

// Route for deleting one growth record by record ID
router
  // Define route path with growth record ID
  .route("/:id")

  // DELETE request deletes one growth record
  .delete(protect, deleteGrowthRecord);

// Export router so it can be used in server.js
module.exports = router;