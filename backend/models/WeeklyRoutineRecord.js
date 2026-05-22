const mongoose = require("mongoose");

const dailyRoutineSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      required: true
    },

    sleepHours: {
      type: Number,
      required: true
    },

    dietScore: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },

    activityHours: {
      type: Number,
      required: true
    },

    screenTime: {
      type: Number,
      required: true
    },

    waterIntake: {
      type: Number,
      required: true
    }
  },
  {
    _id: false
  }
);

const weeklyRoutineRecordSchema = new mongoose.Schema(
  {
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      required: true
    },

    weekStartDate: {
      type: Date,
      required: true
    },

    previousGrowthStatus: {
      type: String,
      enum: ["Underdeveloped", "Normal Growth", "Above Average"],
      required: true
    },

    dailyRecords: {
      type: [dailyRoutineSchema],
      required: true
    },

    avgSleepHours: {
      type: Number,
      required: true
    },

    avgDietScore: {
      type: Number,
      required: true
    },

    avgActivityHours: {
      type: Number,
      required: true
    },

    avgScreenTime: {
      type: Number,
      required: true
    },

    avgWaterIntake: {
      type: Number,
      required: true
    },

    progressStatus: {
      type: String,
      enum: ["Improving", "No Significant Change", "Getting Worse"],
      required: true
    },

    improvementPercentage: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "WeeklyRoutineRecord",
  weeklyRoutineRecordSchema
);