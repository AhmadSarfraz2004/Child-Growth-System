const mongoose = require("mongoose");

const growthRecordSchema = new mongoose.Schema(
  {
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      required: true
    },

    age: {
      type: Number,
      required: true
    },

    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true
    },

    heightCm: {
      type: Number,
      required: true
    },

    weightKg: {
      type: Number,
      required: true
    },

    bmi: {
      type: Number,
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

    growthStatus: {
      type: String,
      enum: ["Underdeveloped", "Normal Growth", "Above Average"],
      required: true
    },

    confidenceScore: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("GrowthRecord", growthRecordSchema);