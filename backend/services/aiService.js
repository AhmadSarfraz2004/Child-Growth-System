const axios = require("axios"); // Imports axios to send HTTP requests from Node backend to FastAPI AI service.

const AI_SERVICE_URL = process.env.AI_SERVICE_URL; // Gets AI service base URL from environment variables.

if (!AI_SERVICE_URL) {
  throw new Error("AI_SERVICE_URL is missing in environment variables"); // Stops backend if AI service URL is not configured.
} // Checks whether AI service URL exists.

// Function to call AI API for growth status prediction.
const predictGrowthStatus = async (growthInputData) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/predict/growth-status`, // Sends request to FastAPI growth prediction endpoint.
      growthInputData, // Sends child growth input data to AI service.
      {
        timeout: 10000, // Stops request if AI service does not respond within 10 seconds.
      }
    ); // Calls AI service using POST request.

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Growth prediction failed"); // Throws clear error if AI response is unsuccessful.
    } // Checks whether AI service returned success.

    return response.data.prediction; // Returns prediction result to controller.
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Growth prediction AI service failed"
    ); // Sends readable AI service error to controller.
  } // Handles AI service errors.
}; // Ends growth status prediction function.

// Function to call AI API for weekly progress prediction.
const predictWeeklyProgress = async (weeklyInputData) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/predict-progress`, // Sends request to FastAPI weekly progress endpoint.
      weeklyInputData, // Sends weekly routine input data to AI service.
      {
        timeout: 10000, // Stops request if AI service takes too long.
      }
    ); // Calls AI service using POST request.

    return response.data; // Returns weekly progress result to controller.
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Weekly progress AI service failed"
    ); // Sends readable weekly progress error to controller.
  } // Handles weekly progress AI errors.
}; // Ends weekly progress prediction function.

// Function to call AI API for recommendation prediction.
const predictRecommendations = async (recommendationInputData) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/predict-recommendations`, // Sends request to FastAPI recommendation endpoint.
      recommendationInputData, // Sends recommendation input data to AI service.
      {
        timeout: 10000, // Stops request if AI service takes too long.
      }
    ); // Calls AI service using POST request.

    return response.data; // Returns recommendation result to controller.
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Recommendation AI service failed"
    ); // Sends readable recommendation error to controller.
  } // Handles recommendation AI errors.
}; // Ends recommendation prediction function.

module.exports = {
  predictGrowthStatus, // Exports growth status prediction function.
  predictWeeklyProgress, // Exports weekly progress prediction function.
  predictRecommendations, // Exports recommendation prediction function.
}; // Makes AI service functions available to controllers.