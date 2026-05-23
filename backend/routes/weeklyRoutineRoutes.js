// Import express to create router
const express = require("express");

// Import weekly routine controller functions
const {
  addWeeklyRoutine,
  getWeeklyRoutinesByChild,
  getSingleWeeklyRoutine,
  deleteWeeklyRoutine,
} = require("../controllers/weeklyRoutineController");

// Import protect middleware to secure routes
const { protect } = require("../middleware/authMiddleware");

// Create express router
const router = express.Router();

// Route to add weekly routine and get weekly history of a child
router
  // Define route with childId parameter
  .route("/:childId")

  // POST request adds weekly routine for selected child
  .post(protect, addWeeklyRoutine)

  // GET request gets weekly routine history of selected child
  .get(protect, getWeeklyRoutinesByChild);

// Route to get single weekly routine record by ID
router
  // Define route for single weekly routine record
  .route("/single/:id")

  // GET request gets one weekly routine record
  .get(protect, getSingleWeeklyRoutine);

// Route to delete weekly routine record by ID
router
  // Define route with weekly routine record ID
  .route("/:id")

  // DELETE request deletes one weekly routine record
  .delete(protect, deleteWeeklyRoutine);

// Export router to use it in server.js
module.exports = router;