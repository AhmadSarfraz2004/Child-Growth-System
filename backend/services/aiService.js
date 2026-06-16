// Import axios package to send HTTP requests from backend to AI service
const axios = require("axios");

// Store AI service base URL from environment variables
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// Function to call AI API for growth status prediction
const predictGrowthStatus = async (growthInputData) => {
  // Start try block to handle successful AI API request
  try {
    // Send POST request to Python AI service growth prediction endpoint
    const response = await axios.post(
      // Build complete AI endpoint URL for growth prediction
      `${AI_SERVICE_URL}/predict/growth-status`,

      // Send growth input data to AI service
      growthInputData,

      // Set a timeout so the backend does not hang forever if AI service is down
      {
        timeout: 10000,
      }
    );

    // Check if AI service explicitly returned a failed response
    if (!response.data?.success) {
      // Throw the AI service message so the controller can return it clearly
      throw new Error(response.data?.message || "Growth prediction failed");
    }

    // Return only the prediction object needed by the controller
    return response.data.prediction;
  } catch (error) {
    // Throw custom error if AI service request fails
    throw new Error(
      // Use AI error message if available, otherwise use default message
      error.response?.data?.message ||
        error.message ||
        "Growth prediction AI service failed"
    );
  }
};

// Function to call AI API for weekly progress prediction
const predictWeeklyProgress = async (weeklyInputData) => {
  // Start try block to handle successful AI API request
  try {
    // Send POST request to Python AI service weekly progress prediction endpoint
    const response = await axios.post(
      // Build complete AI endpoint URL for weekly progress prediction
      `${AI_SERVICE_URL}/predict-progress`,

      // Send weekly input data to AI service
      weeklyInputData
    );

    // Return AI service response data to controller
    return response.data;
  } catch (error) {
    // Throw custom error if AI service request fails
    throw new Error(
      // Use AI error message if available, otherwise use default message
      error.response?.data?.message ||
        error.message ||
        "Weekly progress AI service failed"
    );
  }
};

// Function to call AI API for recommendation prediction
const predictRecommendations = async (recommendationInputData) => {
  // Start try block to handle successful AI API request
  try {
    // Send POST request to Python AI service recommendation endpoint
    const response = await axios.post(
      // Build complete AI endpoint URL for recommendation prediction
      `${AI_SERVICE_URL}/predict-recommendations`,

      // Send recommendation input data to AI service
      recommendationInputData
    );

    // Return AI service response data to controller
    return response.data;
  } catch (error) {
    // Throw custom error if AI service request fails
    throw new Error(
      // Use AI error message if available, otherwise use default message
      error.response?.data?.message ||
        error.message ||
        "Recommendation AI service failed"
    );
  }
};

// Export AI service functions so controllers can use them
module.exports = {
  // Export growth status prediction function
  predictGrowthStatus,

  // Export weekly progress prediction function
  predictWeeklyProgress,

  // Export recommendation prediction function
  predictRecommendations,
};
