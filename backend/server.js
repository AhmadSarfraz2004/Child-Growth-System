const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Child Growth System API is running...");
});

// Use authentication routes for register, login, and profile APIs
app.use("/api/auth", require("./routes/authRoutes"));

// Use child routes for child profile management APIs
app.use("/api/children", require("./routes/childRoutes"));

// Use growth record routes for growth prediction records APIs
app.use("/api/growth-records", require("./routes/growthRecordRoutes"));

// Use weekly routine routes for weekly progress tracking APIs
app.use("/api/weekly-routines", require("./routes/weeklyRoutineRoutes"));

// Use recommendation routes for child recommendation records APIs
app.use("/api/recommendations", require("./routes/recommendationRoutes"));

// Use admin routes for super admin dashboard statistics APIs
app.use("/api/admin", require("./routes/adminRoutes"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});