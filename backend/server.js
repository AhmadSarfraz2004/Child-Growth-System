const express = require("express"); // Imports Express framework for creating the backend server.

const dotenv = require("dotenv"); // Imports dotenv package to load environment variables from .env file.

const cors = require("cors"); // Imports CORS package to allow frontend-backend communication.

const connectDB = require("./config/db"); // Imports MongoDB connection function.

dotenv.config(); // Loads environment variables from the .env file.

connectDB(); // Connects backend with MongoDB database.

const app = express(); // Creates an Express application instance.

const PORT = process.env.PORT || 5000; // Uses Render port in production or 5000 locally.

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // Allows deployed frontend or local frontend.
    credentials: true, // Allows credentials such as cookies or authorization headers.
  })
); // Applies CORS middleware to the backend.

app.use(express.json()); // Allows backend to read JSON data from request body.

app.get("/", (req, res) => {
  res.send("Child Growth System API is running..."); // Sends basic API running message.
}); // Creates root route for testing backend.

app.get("/api/health", (req, res) => {
  res.json({
    success: true, // Shows that backend is running successfully.
    message: "Backend is running", // Sends health check message.
  });
}); // Creates health check route for deployment testing.

app.use("/api/auth", require("./routes/authRoutes")); // Connects authentication routes.

app.use("/api/children", require("./routes/childRoutes")); // Connects child profile routes.

app.use("/api/growth-records", require("./routes/growthRecordRoutes")); // Connects growth record routes.

app.use("/api/growth", require("./routes/growthRoutes")); // Connects growth prediction routes.

app.use("/api/weekly-routines", require("./routes/weeklyRoutineRoutes")); // Connects weekly routine routes.

app.use("/api/recommendations", require("./routes/recommendationRoutes")); // Connects recommendation routes.

app.use("/api/admin", require("./routes/adminRoutes")); // Connects admin dashboard routes.

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`); // Prints backend running port in terminal or Render logs.
}); // Starts backend server.