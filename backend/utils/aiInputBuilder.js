// Function to build input data for growth prediction model
const buildGrowthInput = (data) => {
  // Return object that exactly matches growth prediction model input fields
  return {
    // Send age to AI model
    age: data.age,

    // Send gender to AI model
    gender: data.gender,

    // Send height in centimeters using the exact trained model column name
    height: data.height,

    // Send weight in kilograms using the exact trained model column name
    weight: data.weight,

    // Send meal frequency category to AI model
    meals: data.meals,

    // Send fruit and vegetable intake category to AI model
    fruits_veggies: data.fruits_veggies,

    // Send junk food frequency category to AI model
    junk_food: data.junk_food,

    // Send milk/protein intake category to AI model
    protein: data.protein,

    // Send sleep duration category to AI model
    sleep: data.sleep,

    // Send physical activity category to AI model
    activity: data.activity,

    // Send screen time category to AI model
    screen_time: data.screen_time,

    // Send medical condition flag to AI model
    medical: data.medical,

    // Send calculated BMI to AI model
    bmi: data.bmi,
  };
};

// Function to build input data for weekly progress prediction model
const buildWeeklyProgressInput = (data) => {
  // Return object that exactly matches weekly progress model input fields
  return {
    // Send previous growth status to AI model
    previousGrowthStatus: data.previousGrowthStatus,

    // Send average sleep hours to AI model
    avgSleepHours: data.avgSleepHours,

    // Send average diet score to AI model
    avgDietScore: data.avgDietScore,

    // Send average activity hours to AI model
    avgActivityHours: data.avgActivityHours,

    // Send average screen time to AI model
    avgScreenTime: data.avgScreenTime,

    // Send average water intake to AI model
    avgWaterIntake: data.avgWaterIntake,
  };
};

// Function to build input data for recommendation model
const buildRecommendationInput = (data) => {
  // Return object that exactly matches recommendation model input fields
  return {
    // Send age to recommendation model
    age: data.age,

    // Send gender to recommendation model
    gender: data.gender,

    // Send height in centimeters to recommendation model
    heightCm: data.heightCm,

    // Send weight in kilograms to recommendation model
    weightKg: data.weightKg,

    // Send BMI to recommendation model
    bmi: data.bmi,

    // Send growth status to recommendation model
    growthStatus: data.growthStatus,

    // Send sleep hours to recommendation model
    sleepHours: data.sleepHours,

    // Send diet score to recommendation model
    dietScore: data.dietScore,

    // Send activity hours to recommendation model
    activityHours: data.activityHours,

    // Send screen time to recommendation model
    screenTime: data.screenTime,

    // Send water intake to recommendation model if available
    waterIntake: data.waterIntake || null,

    // Send progress status to recommendation model if available
    progressStatus: data.progressStatus || null,
  };
};

// Export input builder functions
module.exports = {
  // Export growth input builder
  buildGrowthInput,

  // Export weekly progress input builder
  buildWeeklyProgressInput,

  // Export recommendation input builder
  buildRecommendationInput,
};
