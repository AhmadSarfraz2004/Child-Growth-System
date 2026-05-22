const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: [
        "Improve Nutrition",
        "Improve Sleep",
        "Increase Physical Activity",
        "Reduce Screen Time",
        "Increase Water Intake",
        "Maintain Current Routine",
        "Consult Pediatrician",
        "Weight Management"
      ],
      required: true
    },

    message: {
      type: String,
      required: true
    }
  },
  {
    _id: false
  }
);

const recommendationRecordSchema = new mongoose.Schema(
  {
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      required: true
    },

    growthRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GrowthRecord",
      default: null
    },

    weeklyRoutineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WeeklyRoutineRecord",
      default: null
    },

    recommendations: {
      type: [recommendationSchema],
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "RecommendationRecord",
  recommendationRecordSchema
);