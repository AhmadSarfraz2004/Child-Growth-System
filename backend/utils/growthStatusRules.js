const hasValue = (value) => value !== undefined && value !== null && value !== "";

const hasMedicalCondition = (medicalCondition = "") =>
  String(medicalCondition).trim().toLowerCase() === "yes";

const getBmiCategoryFromBmi = (bmi) => {
  const value = Number(bmi);

  if (!Number.isFinite(value) || value <= 0) {
    return "Unknown";
  }

  if (value < 14) {
    return "Underweight";
  }

  if (value <= 18.5) {
    return "Normal";
  }

  if (value < 25) {
    return "Overweight";
  }

  return "Obese";
};

const normalizeBmiCategory = (bmiCategory, bmi) => {
  const normalized = String(bmiCategory || "").trim().toLowerCase();

  if (normalized.includes("under")) {
    return "Underweight";
  }

  if (normalized.includes("normal") || normalized.includes("healthy")) {
    return "Normal";
  }

  if (normalized.includes("obese") || normalized.includes("high risk")) {
    return "Obese";
  }

  if (
    normalized.includes("over") ||
    normalized.includes("above") ||
    normalized.includes("review")
  ) {
    return "Overweight";
  }

  return getBmiCategoryFromBmi(bmi);
};

const canonicalizeGrowthStatus = (growthStatus) => {
  const normalized = String(growthStatus || "").trim().toLowerCase();

  if (!normalized) {
    return "Needs Attention";
  }

  if (normalized.includes("needs attention")) {
    return "Needs Attention";
  }

  if (normalized.includes("needs review")) {
    return "Needs Review";
  }

  if (normalized.includes("underdeveloped") || normalized.includes("under")) {
    return "Underdeveloped";
  }

  if (normalized.includes("high risk")) {
    return "High Risk";
  }

  if (normalized.includes("obese")) {
    return "Obese";
  }

  if (normalized.includes("overweight")) {
    return "Overweight";
  }

  if (normalized.includes("above")) {
    return "Above Average";
  }

  if (normalized.includes("healthy")) {
    return "Healthy";
  }

  if (normalized.includes("normal")) {
    return "Normal";
  }

  return String(growthStatus).trim();
};

const normalizeGrowthStatusByBMI = (bmiCategory, aiGrowthStatus, medicalCondition = "") => {
  const category = normalizeBmiCategory(bmiCategory);
  const status = canonicalizeGrowthStatus(aiGrowthStatus);
  const statusKey = status.toLowerCase();
  const medical = hasMedicalCondition(medicalCondition);

  // BMI is a physical-growth guardrail: the AI model cannot label an underweight child as thriving.
  if (category === "Underweight") {
    if (statusKey.includes("under") || statusKey.includes("needs attention")) {
      return status;
    }

    return medical ? "Needs Attention" : "Underdeveloped";
  }

  if (category === "Normal") {
    if (
      statusKey.includes("healthy") ||
      statusKey.includes("normal") ||
      statusKey.includes("above")
    ) {
      return status;
    }

    return medical ? "Needs Attention" : "Normal";
  }

  if (category === "Overweight") {
    if (
      statusKey.includes("above") ||
      statusKey.includes("needs review") ||
      statusKey.includes("overweight")
    ) {
      return status;
    }

    return "Needs Review";
  }

  if (category === "Obese") {
    if (
      statusKey.includes("high risk") ||
      statusKey.includes("obese") ||
      statusKey.includes("needs attention")
    ) {
      return status;
    }

    return medical ? "Needs Attention" : "High Risk";
  }

  return status;
};

const addDoctorRecommendation = (items, medicalCondition) => {
  if (!hasMedicalCondition(medicalCondition)) {
    return items;
  }

  if (items.some((item) => item.category === "Consult Pediatrician")) {
    return items;
  }

  return [
    ...items,
    {
      title: "Consult or monitor with doctor",
      text: "Because a medical condition is marked yes, review the growth plan with a qualified doctor.",
      category: "Consult Pediatrician",
    },
  ];
};

const buildRecommendationPlan = (growthStatus = "", bmiCategory = "", medicalCondition = "") => {
  const status = canonicalizeGrowthStatus(growthStatus);
  const category = normalizeBmiCategory(bmiCategory);
  const statusKey = status.toLowerCase();

  if (
    category === "Underweight" ||
    statusKey.includes("underdeveloped") ||
    statusKey.includes("needs attention")
  ) {
    return {
      headline: "Nutrition and routine support",
      summary: "Focus on steady nutrition, routine, and closer growth monitoring.",
      items: addDoctorRecommendation(
        [
          {
            title: "Increase nutrient-dense meals",
            text: "Add balanced meals with protein, grains, fruits, vegetables, and healthy fats.",
            category: "Improve Nutrition",
          },
          {
            title: "Track routine patterns",
            text: "Monitor meals, sleep, activity, screen time, appetite, and weight changes weekly.",
            category: "Maintain Current Routine",
          },
        ],
        medicalCondition
      ),
    };
  }

  if (category === "Obese" || statusKey.includes("obese") || statusKey.includes("high risk")) {
    return {
      headline: "Weight management and medical review plan",
      summary: "Prioritize safe weight management and medical review alongside healthy routines.",
      items: addDoctorRecommendation(
        [
          {
            title: "Plan a medical review",
            text: "Discuss BMI, diet, activity, and any symptoms with a pediatrician.",
            category: "Consult Pediatrician",
          },
          {
            title: "Support daily movement",
            text: "Build a sustainable activity routine and reduce long sedentary periods.",
            category: "Weight Management",
          },
        ],
        medicalCondition
      ),
    };
  }

  if (
    category === "Overweight" ||
    statusKey.includes("above") ||
    statusKey.includes("overweight") ||
    statusKey.includes("needs review")
  ) {
    return {
      headline: "Healthy balance plan",
      summary: "Keep growth moving in a healthy direction with balanced meals and active routines.",
      items: addDoctorRecommendation(
        [
          {
            title: "Review meal balance",
            text: "Limit sugary drinks and frequent packaged snacks while keeping meals balanced.",
            category: "Weight Management",
          },
          {
            title: "Increase physical activity",
            text: "Encourage daily outdoor play, walking, cycling, sports, or other active routines.",
            category: "Increase Physical Activity",
          },
        ],
        medicalCondition
      ),
    };
  }

  return {
    headline: "Healthy balance plan",
    summary: "The result is in a reassuring range. Continue balanced routines and regular tracking.",
    items: addDoctorRecommendation(
      [
        {
          title: "Maintain balanced meals",
          text: "Continue a steady routine with protein, fruits, vegetables, grains, and enough water.",
          category: "Maintain Current Routine",
        },
        {
          title: "Protect sleep time",
          text: "Keep bedtime consistent and reduce screen time close to sleep.",
          category: "Improve Sleep",
        },
      ],
      medicalCondition
    ),
  };
};

module.exports = {
  buildRecommendationPlan,
  canonicalizeGrowthStatus,
  getBmiCategoryFromBmi,
  hasValue,
  normalizeBmiCategory,
  normalizeGrowthStatusByBMI,
};
