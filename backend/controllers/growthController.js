// Import AI service function that calls the Python FastAPI service
const { predictGrowthStatus } = require("../services/aiService");

// Import builder that formats data using the exact trained model column names
const { buildGrowthInput } = require("../utils/aiInputBuilder");

// Import GrowthRecord model to save AI prediction history
const GrowthRecord = require("../models/GrowthRecord");

// Import Child model to verify child ownership when childId is provided
const Child = require("../models/Child");

// Import mongoose to validate MongoDB ObjectId values
const mongoose = require("mongoose");

// Function to check whether a value was provided in the request body
const hasValue = (value) => value !== undefined && value !== null && value !== "";

// Function to convert request values into numbers safely
const toNumber = (value) => Number(value);

// Function to use a numeric request value when present, otherwise use a safe default
const optionalNumber = (value, defaultValue) => {
  // Return the default value when the frontend did not provide this field
  if (!hasValue(value)) {
    return defaultValue;
  }

  // Convert provided value into a number for MongoDB validation
  const numericValue = toNumber(value);

  // Fall back to default if provided value is not a valid number
  return Number.isNaN(numericValue) ? defaultValue : numericValue;
};

// Define realistic measurement limits so impossible values do not reach the AI model
const measurementLimits = {
  // Child age is stored in years for the current prediction form
  age: { min: 0, max: 18, label: "Age", unit: "years" },

  // Height is expected in centimeters, not feet or inches
  height: { min: 40, max: 220, label: "Height", unit: "cm" },

  // Weight is expected in kilograms
  weight: { min: 2, max: 150, label: "Weight", unit: "kg" },

  // BMI outside this range is usually a unit/input mistake for this app
  bmi: { min: 8, max: 60, label: "BMI", unit: "" },
};

// Store the categorical values exactly as the trained model encoders expect them
const modelAllowedValues = {
  // Gender must match the label encoder classes from the AI model
  gender: ["Female", "Male"],

  // Meals per day category must match the AI model encoder
  meals: ["1-2 Meals", "3 Meals", "4 or more Meals"],

  // Fruit and vegetable intake category must match the AI model encoder
  fruits_veggies: [
    "Daily (6–7 days/week)",
    "Often (4–5 days/week)",
    "Rarely (0–1 days/week)",
    "Sometimes (2–3 days/week)",
  ],

  // Junk food frequency category must match the AI model encoder
  junk_food: ["1–2 times/week", "3–4 times/week", "Daily", "Rarely"],

  // Milk/protein intake category must match the AI model encoder
  protein: ["1–2 times/week", "3–4 times/week", "Daily", "Rarely"],

  // Sleep duration category must match the AI model encoder
  sleep: ["6–8 hours", "8–10 hours", "Less than 6 hours", "More than 10 hours"],

  // Physical activity category must match the AI model encoder
  activity: ["1–2 hours", "30–60 minutes", "Less than 30 minutes", "More than 2 hours"],

  // Screen time category must match the AI model encoder
  screen_time: ["1–2 hours", "3–4 hours", "Less than 1 hour", "More than 4 hours"],

  // Medical condition category must match the AI model encoder
  medical: ["No", "Yes"],
};

// Store user-friendly labels for model input validation messages
const modelFieldLabels = {
  // Label for meals field
  meals: "Meals per day",

  // Label for fruit and vegetable intake field
  fruits_veggies: "Fruit/Veg intake",

  // Label for junk food field
  junk_food: "Junk food frequency",

  // Label for protein field
  protein: "Milk/Protein intake",

  // Label for sleep field
  sleep: "Sleep hours",

  // Label for activity field
  activity: "Physical activity",

  // Label for screen time field
  screen_time: "Screen time",

  // Label for medical condition field
  medical: "Medical condition",
};

// Function to calculate BMI from height and weight using centimeters and kilograms
const calculateExpectedBmi = (height, weight) => {
  // Convert centimeters into meters before applying BMI formula
  const heightInMeters = height / 100;

  // Return BMI rounded to one decimal place for consistent storage and display
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
};

// Function to validate one numeric measurement against its allowed range
const getRangeValidationMessage = (value, limit) => {
  // Reject values smaller than the allowed minimum
  if (value < limit.min) {
    return `${limit.label} must be between ${limit.min} and ${limit.max}${limit.unit ? ` ${limit.unit}` : ""}`;
  }

  // Reject values larger than the allowed maximum
  if (value > limit.max) {
    return `${limit.label} must be between ${limit.min} and ${limit.max}${limit.unit ? ` ${limit.unit}` : ""}`;
  }

  // Return an empty string when the value is inside the allowed range
  return "";
};

// Function to read a value using a primary field name and one optional alias
const getFieldValue = (body, primaryField, aliasField) => {
  // Return the primary field when the request contains it
  if (hasValue(body[primaryField])) {
    return body[primaryField];
  }

  // Return the alias field when older frontend code sends that shape
  if (aliasField && hasValue(body[aliasField])) {
    return body[aliasField];
  }

  // Return undefined when neither field exists
  return undefined;
};

// Function to normalize request fields into the trained model's categorical names
const normalizeModelFeatures = (body) => ({
  // Normalize meals per day
  meals: getFieldValue(body, "meals"),

  // Normalize fruit and vegetable intake
  fruits_veggies: getFieldValue(body, "fruits_veggies", "fruitsVeggies"),

  // Normalize junk food frequency
  junk_food: getFieldValue(body, "junk_food", "junkFood"),

  // Normalize milk/protein intake
  protein: getFieldValue(body, "protein"),

  // Normalize sleep duration category
  sleep: getFieldValue(body, "sleep", "sleepCategory"),

  // Normalize physical activity category
  activity: getFieldValue(body, "activity", "physicalActivity"),

  // Normalize screen time category
  screen_time: getFieldValue(body, "screen_time", "screenTimeCategory"),

  // Normalize medical condition flag
  medical: getFieldValue(body, "medical", "medicalCondition"),
});

// Function to validate required categorical model features
const getModelFeatureValidationMessage = (modelFeatures) => {
  // Loop through every categorical model field that must be provided
  for (const fieldName of Object.keys(modelAllowedValues).filter((field) => field !== "gender")) {
    // Return a helpful message when a model feature is missing
    if (!hasValue(modelFeatures[fieldName])) {
      return `${modelFieldLabels[fieldName]} is required`;
    }

    // Return a helpful message when a value does not match the trained encoder classes
    if (!modelAllowedValues[fieldName].includes(modelFeatures[fieldName])) {
      return `${modelFieldLabels[fieldName]} must be one of: ${modelAllowedValues[fieldName].join(", ")}`;
    }
  }

  // Return an empty string when all model features are valid
  return "";
};

// Function to normalize frontend field names into the AI model field names
const buildGrowthPredictionInput = (body) => {
  // Support both height and heightCm so existing frontend names can still work
  const height = hasValue(body.height) ? body.height : body.heightCm;

  // Support both weight and weightKg so existing frontend names can still work
  const weight = hasValue(body.weight) ? body.weight : body.weightKg;

  // Return only the exact columns expected by the trained Python model
  return buildGrowthInput({
    // Keep normalized model-ready values from the request
    ...body,

    // Send height using the model column name
    height,

    // Send weight using the model column name
    weight,

    // Send BMI using the model column name
    bmi: body.bmi,
  });
};

// Function to format a growth record for API responses
const formatGrowthRecord = (record) => ({
  // Return MongoDB record ID
  _id: record._id,

  // Return child age
  age: record.age,

  // Return child gender
  gender: record.gender,

  // Return child display name when this was a standalone assessment
  childName: record.childName,

  // Return normalized height and fall back to legacy heightCm if needed
  height: record.height ?? record.heightCm,

  // Return normalized weight and fall back to legacy weightKg if needed
  weight: record.weight ?? record.weightKg,

  // Return BMI
  bmi: record.bmi,

  // Return AI growth status
  growthStatus: record.growthStatus,

  // Return meals category used by the AI model
  meals: record.meals,

  // Return fruit and vegetable intake category used by the AI model
  fruitsVeggies: record.fruitsVeggies,

  // Return junk food frequency category used by the AI model
  junkFood: record.junkFood,

  // Return milk/protein intake category used by the AI model
  protein: record.protein,

  // Return sleep category used by the AI model
  sleep: record.sleep,

  // Return physical activity category used by the AI model
  activity: record.activity,

  // Return screen time category used by the AI model
  screenTimeCategory: record.screenTimeCategory,

  // Return medical condition category used by the AI model
  medical: record.medical,

  // Return optional water intake saved with the assessment
  waterIntake: record.waterIntake,

  // Return creation date for history screens
  createdAt: record.createdAt,
});

// @desc    Predict child growth status using Python AI service
// @route   POST /api/growth/predict
// @access  Private
const predictGrowth = async (req, res) => {
  // Start try block to handle successful prediction
  try {
    // Extract request body sent by frontend
    const requestBody = req.body;

    // Get logged-in user ID from auth middleware
    const userId = req.user?._id || req.user?.id;

    // Normalize height field from possible frontend names
    const height = hasValue(requestBody.height) ? requestBody.height : requestBody.heightCm;

    // Normalize weight field from possible frontend names
    const weight = hasValue(requestBody.weight) ? requestBody.weight : requestBody.weightKg;

    // Normalize optional child ID from possible frontend field names
    const childId = hasValue(requestBody.child) ? requestBody.child : requestBody.childId;

    // Normalize all lifestyle/nutrition fields into trained model column names
    const modelFeatures = normalizeModelFeatures(requestBody);

    // Validate required fields before calling the AI service
    if (
      // Check logged-in user ID
      !hasValue(userId) ||

      // Check child age
      !hasValue(requestBody.age) ||

      // Check child gender
      !hasValue(requestBody.gender) ||

      // Check child height
      !hasValue(height) ||

      // Check child weight
      !hasValue(weight) ||

      // Check BMI
      !hasValue(requestBody.bmi)
    ) {
      // Return validation error response when required fields are missing
      return res.status(400).json({
        // Mark request as failed
        success: false,

        // Send validation message
        message: "Please provide age, gender, height, weight, and bmi",
      });
    }

    // Validate gender against the AI model encoder values
    if (!modelAllowedValues.gender.includes(requestBody.gender)) {
      // Return validation error response for unsupported gender values
      return res.status(400).json({
        // Mark request as failed
        success: false,

        // Send clean validation message
        message: `Gender must be one of: ${modelAllowedValues.gender.join(", ")}`,
      });
    }

    // Validate required lifestyle/nutrition fields before calling the AI service
    const modelFeatureMessage = getModelFeatureValidationMessage(modelFeatures);

    // Stop when any model-ready lifestyle field is missing or invalid
    if (modelFeatureMessage) {
      // Return validation error response for missing model inputs
      return res.status(400).json({
        // Mark request as failed
        success: false,

        // Send clean validation message
        message: modelFeatureMessage,
      });
    }

    // Convert age to number before sending to AI and saving to MongoDB
    const numericAge = toNumber(requestBody.age);

    // Convert height to number before sending to AI and saving to MongoDB
    const numericHeight = toNumber(height);

    // Convert weight to number before sending to AI and saving to MongoDB
    const numericWeight = toNumber(weight);

    // Convert BMI to number before sending to AI and saving to MongoDB
    const numericBmi = toNumber(requestBody.bmi);

    // Prepare sleep hours fallback for older GrowthRecord schema compatibility
    const numericSleepHours = optionalNumber(requestBody.sleepHours, 0);

    // Prepare diet score fallback for older GrowthRecord schema compatibility
    const numericDietScore = optionalNumber(requestBody.dietScore, 1);

    // Prepare activity hours fallback for older GrowthRecord schema compatibility
    const numericActivityHours = optionalNumber(requestBody.activityHours, 0);

    // Prepare screen time fallback for older GrowthRecord schema compatibility
    const numericScreenTime = optionalNumber(requestBody.screenTime, 0);

    // Prepare water intake as optional history/debug data because the current model does not use it
    const numericWaterIntake = hasValue(requestBody.waterIntake) ? toNumber(requestBody.waterIntake) : null;

    // Validate numeric fields so MongoDB and AI service receive clean values
    if (
      !Number.isFinite(numericAge) ||
      !Number.isFinite(numericHeight) ||
      !Number.isFinite(numericWeight) ||
      !Number.isFinite(numericBmi)
    ) {
      // Return validation error response for invalid numeric input
      return res.status(400).json({
        // Mark request as failed
        success: false,

        // Send validation message
        message: "Age, height, weight, and bmi must be valid numbers",
      });
    }

    // Validate optional water intake when the frontend sends it
    if (numericWaterIntake !== null && (!Number.isFinite(numericWaterIntake) || numericWaterIntake < 0 || numericWaterIntake > 20)) {
      // Return validation error response for invalid water intake
      return res.status(400).json({
        // Mark request as failed
        success: false,

        // Send clean validation message
        message: "Water intake must be between 0 and 20 glasses",
      });
    }

    // Validate age against the supported child age range
    const ageRangeMessage = getRangeValidationMessage(numericAge, measurementLimits.age);

    // Stop when age is outside the supported range
    if (ageRangeMessage) {
      return res.status(400).json({
        // Mark request as failed
        success: false,

        // Send clean validation message
        message: ageRangeMessage,
      });
    }

    // Validate height against realistic centimeter values
    const heightRangeMessage = getRangeValidationMessage(numericHeight, measurementLimits.height);

    // Stop when height is outside the supported range
    if (heightRangeMessage) {
      return res.status(400).json({
        // Mark request as failed
        success: false,

        // Send clean validation message with unit guidance
        message: `${heightRangeMessage}. Use centimeters, for example 110 cm`,
      });
    }

    // Validate weight against realistic kilogram values
    const weightRangeMessage = getRangeValidationMessage(numericWeight, measurementLimits.weight);

    // Stop when weight is outside the supported range
    if (weightRangeMessage) {
      return res.status(400).json({
        // Mark request as failed
        success: false,

        // Send clean validation message
        message: weightRangeMessage,
      });
    }

    // Validate BMI against a broad realistic range
    const bmiRangeMessage = getRangeValidationMessage(numericBmi, measurementLimits.bmi);

    // Stop when BMI is outside the supported range
    if (bmiRangeMessage) {
      return res.status(400).json({
        // Mark request as failed
        success: false,

        // Send clean validation message
        message: bmiRangeMessage,
      });
    }

    // Calculate BMI on the server from height and weight so the saved value is trustworthy
    const expectedBmi = calculateExpectedBmi(numericHeight, numericWeight);

    // Reject requests where provided BMI does not match height and weight closely enough
    if (Math.abs(numericBmi - expectedBmi) > 0.5) {
      return res.status(400).json({
        // Mark request as failed
        success: false,

        // Send clean validation message with the server-calculated BMI
        message: `BMI does not match height and weight. Expected about ${expectedBmi}`,
      });
    }

    // Prepare child variable so prediction can be saved with or without child
    let child = null;

    // Verify child ownership when frontend sends a child ID
    if (hasValue(childId)) {
      // Reject invalid MongoDB IDs before querying database
      if (!mongoose.Types.ObjectId.isValid(childId)) {
        // Return validation error for invalid child ID
        return res.status(400).json({
          // Mark request as failed
          success: false,

          // Send validation message
          message: "Invalid child ID",
        });
      }

      // Find child and make sure it belongs to the logged-in parent
      child = await Child.findOne({
        // Match child using request child ID
        _id: childId,

        // Match child parentId with logged-in user ID
        parentId: userId,
      });

      // Stop if child was not found for this user
      if (!child) {
        // Return not found response
        return res.status(404).json({
          // Mark request as failed
          success: false,

          // Send error message
          message: "Child not found",
        });
      }
    }

    // Build clean input object for the Python AI service
    const growthInputData = buildGrowthPredictionInput({
      // Keep original request data
      ...requestBody,

      // Send numeric age to AI service
      age: numericAge,

      // Send normalized numeric height to AI service
      height: numericHeight,

      // Send normalized numeric weight to AI service
      weight: numericWeight,

      // Send validated nutrition/sleep/activity model fields to AI service
      ...modelFeatures,

      // Send numeric BMI to AI service
      bmi: expectedBmi,
    });

    // Prepare prediction variable outside try block so it can be saved afterward
    let prediction;

    // Start try block for AI prediction failure handling
    try {
      // Call Python AI service and wait for prediction
      prediction = await predictGrowthStatus(growthInputData);
    } catch (error) {
      // Return clean AI failure response
      return res.status(502).json({
        // Mark request as failed
        success: false,

        // Send clean error message
        message: "AI prediction failed",
      });
    }

    // Extract growth status from AI service response
    const growthStatus = prediction?.growthStatus;

    // Validate that AI service returned the expected field
    if (!hasValue(growthStatus)) {
      // Return clean AI failure response when prediction payload is incomplete
      return res.status(502).json({
        // Mark request as failed
        success: false,

        // Send clean error message
        message: "AI prediction failed",
      });
    }

    // Prepare saved record variable outside try block for response
    let savedRecord;

    // Start try block for MongoDB save failure handling
    try {
      // Save AI prediction result in MongoDB
      savedRecord = await GrowthRecord.create({
        // Save logged-in parent/user ID
        user: userId,

        // Save child reference when a valid child was provided
        child: child?._id || null,

        // Save legacy childId too so older child history queries still work
        childId: child?._id || null,

        // Save child age
        age: numericAge,

        // Save child gender
        gender: requestBody.gender,

        // Save child display name when frontend sends a standalone assessment name
        childName: requestBody.childName || child?.name || null,

        // Save normalized height in centimeters
        height: numericHeight,

        // Save normalized weight in kilograms
        weight: numericWeight,

        // Save legacy height field for compatibility with older code
        heightCm: numericHeight,

        // Save legacy weight field for compatibility with older code
        weightKg: numericWeight,

        // Save BMI
        bmi: expectedBmi,

        // Save meals category used by the AI model
        meals: modelFeatures.meals,

        // Save fruit and vegetable intake category used by the AI model
        fruitsVeggies: modelFeatures.fruits_veggies,

        // Save junk food frequency category used by the AI model
        junkFood: modelFeatures.junk_food,

        // Save milk/protein intake category used by the AI model
        protein: modelFeatures.protein,

        // Save sleep category used by the AI model
        sleep: modelFeatures.sleep,

        // Save physical activity category used by the AI model
        activity: modelFeatures.activity,

        // Save screen time category used by the AI model
        screenTimeCategory: modelFeatures.screen_time,

        // Save medical condition category used by the AI model
        medical: modelFeatures.medical,

        // Save water intake for history/debugging even though current model does not use it
        waterIntake: numericWaterIntake,

        // Save safe sleep hours value for compatibility with older history records
        sleepHours: numericSleepHours,

        // Save safe diet score value for compatibility with older history records
        dietScore: numericDietScore,

        // Save safe physical activity value for compatibility with older history records
        activityHours: numericActivityHours,

        // Save safe screen time value for compatibility with older history records
        screenTime: numericScreenTime,

        // Save AI prediction result
        growthStatus,

        // Save full original request body for debugging/history
        inputData: {
          // Save original request body
          ...requestBody,

          // Save the exact AI payload sent to the Python service
          modelInput: growthInputData,
        },

        // Mark record as produced by AI model
        predictionSource: "AI_MODEL",
      });
    } catch (error) {
      // Log the detailed save error in backend console for debugging
      console.error("Growth prediction save failed:", error.message);

      // Return clean MongoDB save failure response
      return res.status(500).json({
        // Mark request as failed
        success: false,

        // Send clean error message
        message: "Prediction received but failed to save record",

        // Include technical details only outside production
        error: process.env.NODE_ENV === "production" ? undefined : error.message,
      });
    }

    // Return successful prediction response to frontend
    return res.status(200).json({
      // Mark request as successful
      success: true,

      // Send success message
      message: "Growth status predicted and saved successfully",

      // Send prediction and saved MongoDB record
      data: {
        // Send growth status for quick frontend display
        growthStatus,

        // Send saved record details
        record: formatGrowthRecord(savedRecord),
      },
    });
  } catch (error) {
    // Return server error response when AI service call fails
    return res.status(500).json({
      // Mark request as failed
      success: false,

      // Send general error message
      message: "Server error while predicting growth status",

      // Send actual error message for debugging
      error: error.message,
    });
  }
};

// @desc    Get logged-in user's growth prediction history
// @route   GET /api/growth/history
// @access  Private
const getGrowthHistory = async (req, res) => {
  // Start try block to handle successful history fetch
  try {
    // Get logged-in user ID from auth middleware
    const userId = req.user?._id || req.user?.id;

    // Find records that belong only to the logged-in user
    const records = await GrowthRecord.find({
      // Match records by user ID
      user: userId,
    })
      // Sort newest records first
      .sort({ createdAt: -1 })

      // Convert mongoose documents into plain objects for formatting
      .lean();

    // Return successful history response
    return res.status(200).json({
      // Mark request as successful
      success: true,

      // Send success message
      message: "Growth history fetched successfully",

      // Send formatted records array
      data: records.map(formatGrowthRecord),
    });
  } catch (error) {
    // Return server error response if history fetch fails
    return res.status(500).json({
      // Mark request as failed
      success: false,

      // Send clean error message
      message: "Server error while fetching growth history",
    });
  }
};

// @desc    Get logged-in user's growth prediction history for one child
// @route   GET /api/growth/history/:childId
// @access  Private
const getGrowthHistoryByChild = async (req, res) => {
  // Start try block to handle successful child history fetch
  try {
    // Get logged-in user ID from auth middleware
    const userId = req.user?._id || req.user?.id;

    // Extract childId from request URL parameters
    const { childId } = req.params;

    // Reject invalid MongoDB IDs before querying database
    if (!mongoose.Types.ObjectId.isValid(childId)) {
      // Return validation error for invalid child ID
      return res.status(400).json({
        // Mark request as failed
        success: false,

        // Send validation message
        message: "Invalid child ID",
      });
    }

    // Find child and make sure it belongs to the logged-in parent
    const child = await Child.findOne({
      // Match child using URL childId
      _id: childId,

      // Match child parentId with logged-in user ID
      parentId: userId,
    });

    // Stop if child does not exist or does not belong to this user
    if (!child) {
      // Return not found response
      return res.status(404).json({
        // Mark request as failed
        success: false,

        // Send error message
        message: "Child not found",
      });
    }

    // Find records for this user and this child only
    const records = await GrowthRecord.find({
      // Match records by user ID
      user: userId,

      // Match both new child field and legacy childId field
      $or: [{ child: childId }, { childId }],
    })
      // Sort newest records first
      .sort({ createdAt: -1 })

      // Convert mongoose documents into plain objects for formatting
      .lean();

    // Return successful child history response
    return res.status(200).json({
      // Mark request as successful
      success: true,

      // Send success message
      message: "Growth history fetched successfully",

      // Send formatted records array
      data: records.map(formatGrowthRecord),
    });
  } catch (error) {
    // Return server error response if child history fetch fails
    return res.status(500).json({
      // Mark request as failed
      success: false,

      // Send clean error message
      message: "Server error while fetching child growth history",
    });
  }
};

// Export controller functions so routes can use them
module.exports = {
  // Export growth prediction controller
  predictGrowth,

  // Export user growth history controller
  getGrowthHistory,

  // Export child growth history controller
  getGrowthHistoryByChild,
};
