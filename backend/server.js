const express = require("express"); // Imports Express framework.

const dotenv = require("dotenv"); // Imports dotenv to load environment variables locally.

const cors = require("cors"); // Imports CORS package.

const connectDB = require("./config/db"); // Imports MongoDB connection function.

dotenv.config(); // Loads environment variables from .env file.

connectDB(); // Connects backend with MongoDB database.

const app = express(); // Creates Express application.

const PORT = process.env.PORT || 5000; // Uses local port when running locally.

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // Allows frontend URL.
    credentials: true, // Allows credentials if needed.
  })
); // Applies CORS middleware.

app.use(express.json()); // Allows backend to read JSON request bodies.

app.get("/", (req, res) => {
  res.send("Child Growth System API is running..."); // Root route.
}); // Creates root test route.

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is running",
  });
}); // Creates backend health route.

app.use("/api/auth", require("./routes/authRoutes")); // Uses authentication routes.

app.use("/api/children", require("./routes/childRoutes")); // Uses child routes.

app.use("/api/growth-records", require("./routes/growthRecordRoutes")); // Uses growth record routes.

app.use("/api/growth", require("./routes/growthRoutes")); // Uses growth AI routes.

app.use("/api/weekly-routines", require("./routes/weeklyRoutineRoutes")); // Uses weekly routine routes.

app.use("/api/recommendations", require("./routes/recommendationRoutes")); // Uses recommendation routes.

app.use("/api/admin", require("./routes/adminRoutes")); // Uses admin dashboard routes.

if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend running on port ${PORT}`);
  });
} // Starts server only locally, not on Vercel.

module.exports = app; // Exports app for Vercel.