// Import mongoose to define the MongoDB schema and model
const mongoose = require("mongoose");

// Create schema for saved child growth prediction records
const growthRecordSchema = new mongoose.Schema(
  {
    // Store the parent/user who created this prediction record
    user: {
      // Use MongoDB ObjectId because this field references another collection
      type: mongoose.Schema.Types.ObjectId,

      // Reference the User model for population when needed
      ref: "User",

      // Require user so each saved record belongs to one logged-in parent
      required: true,
    },

    // Store the child linked to this prediction when a childId is provided
    child: {
      // Use MongoDB ObjectId because this field references the Child collection
      type: mongoose.Schema.Types.ObjectId,

      // Reference the Child model because this project already has one
      ref: "Child",

      // Keep child optional because the predict endpoint sample can run without a childId
      default: null,
    },

    // Keep old childId field so existing growth-record APIs keep working
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      default: null,
    },

    // Store child age at the time of prediction
    age: {
      type: Number,
      required: true,
    },

    // Store child gender at the time of prediction
    gender: {
      type: String,
      required: true,
      trim: true,
    },

    // Store child name when prediction is created from a standalone assessment form
    childName: {
      type: String,
      trim: true,
      default: null,
    },

    // Store normalized height value in centimeters for the new AI prediction flow
    height: {
      type: Number,
      required: true,
    },

    // Store normalized weight value in kilograms for the new AI prediction flow
    weight: {
      type: Number,
      required: true,
    },

    // Keep old heightCm field so existing growth-record APIs keep working
    heightCm: {
      type: Number,
      default: null,
    },

    // Keep old weightKg field so existing growth-record APIs keep working
    weightKg: {
      type: Number,
      default: null,
    },

    // Store calculated or provided BMI value
    bmi: {
      type: Number,
      required: true,
    },

    // Store meals category used by the trained AI model
    meals: {
      type: String,
      trim: true,
      default: null,
    },

    // Store fruit and vegetable intake category used by the trained AI model
    fruitsVeggies: {
      type: String,
      trim: true,
      default: null,
    },

    // Store junk food frequency category used by the trained AI model
    junkFood: {
      type: String,
      trim: true,
      default: null,
    },

    // Store milk/protein intake category used by the trained AI model
    protein: {
      type: String,
      trim: true,
      default: null,
    },

    // Store sleep category used by the trained AI model
    sleep: {
      type: String,
      trim: true,
      default: null,
    },

    // Store physical activity category used by the trained AI model
    activity: {
      type: String,
      trim: true,
      default: null,
    },

    // Store screen time category used by the trained AI model
    screenTimeCategory: {
      type: String,
      trim: true,
      default: null,
    },

    // Store medical condition category used by the trained AI model
    medical: {
      type: String,
      trim: true,
      default: null,
    },

    // Store water intake for history even though the current model does not use it
    waterIntake: {
      type: Number,
      default: null,
    },

    // Store optional sleep hours when the older detailed growth-record API sends it
    sleepHours: {
      type: Number,
      default: null,
    },

    // Store optional diet score when the older detailed growth-record API sends it
    dietScore: {
      type: Number,
      min: 1,
      max: 10,
      default: null,
    },

    // Store optional physical activity hours when the older API sends it
    activityHours: {
      type: Number,
      default: null,
    },

    // Store optional screen time when the older API sends it
    screenTime: {
      type: Number,
      default: null,
    },

    // Store the final growth status returned by the AI model
    growthStatus: {
      type: String,
      required: true,
      trim: true,
    },

    // Store optional model confidence score if a future AI service returns it
    confidenceScore: {
      type: Number,
      default: null,
    },

    // Store the full request body for debugging and history review
    inputData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Store where the prediction/status came from
    predictionSource: {
      type: String,
      default: "AI_MODEL",
    },
  },
  {
    // Automatically add createdAt and updatedAt fields
    timestamps: true,
  }
);

// Keep new and old child/height/weight fields synchronized before validation
growthRecordSchema.pre("validate", function syncCompatibilityFields() {
  // Copy old childId into new child field when only the old field is provided
  if (!this.child && this.childId) {
    this.child = this.childId;
  }

  // Copy new child into old childId field when only the new field is provided
  if (!this.childId && this.child) {
    this.childId = this.child;
  }

  // Copy old heightCm into new height field when only the old field is provided
  if (
    (this.height === undefined || this.height === null) &&
    this.heightCm !== undefined &&
    this.heightCm !== null
  ) {
    this.height = this.heightCm;
  }

  // Copy new height into old heightCm field when only the new field is provided
  if (
    (this.heightCm === undefined || this.heightCm === null) &&
    this.height !== undefined &&
    this.height !== null
  ) {
    this.heightCm = this.height;
  }

  // Copy old weightKg into new weight field when only the old field is provided
  if (
    (this.weight === undefined || this.weight === null) &&
    this.weightKg !== undefined &&
    this.weightKg !== null
  ) {
    this.weight = this.weightKg;
  }

  // Copy new weight into old weightKg field when only the new field is provided
  if (
    (this.weightKg === undefined || this.weightKg === null) &&
    this.weight !== undefined &&
    this.weight !== null
  ) {
    this.weightKg = this.weight;
  }

  // Mongoose continues validation after this synchronous hook returns
});

// Add index to make user history queries fast and sorted by newest first
growthRecordSchema.index({ user: 1, createdAt: -1 });

// Add index to make child-specific history queries fast
growthRecordSchema.index({ child: 1, createdAt: -1 });

// Export GrowthRecord model for controllers
module.exports = mongoose.model("GrowthRecord", growthRecordSchema);
