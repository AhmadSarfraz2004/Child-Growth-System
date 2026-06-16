const assert = require("assert");

const {
  getBmiCategoryFromBmi,
  normalizeGrowthStatusByBMI,
} = require("../utils/growthStatusRules");

const calculateBmi = (height, weight) =>
  Number((weight / ((height / 100) * (height / 100))).toFixed(1));

const testCases = [
  {
    name: "underweight healthy lifestyle cannot be above average",
    height: 110,
    weight: 10,
    aiStatus: "Above Average",
    medical: "No",
    expectedCategory: "Underweight",
    allowedStatuses: ["Underdeveloped", "Needs Attention"],
    disallowedStatuses: ["Above Average"],
  },
  {
    name: "normal BMI can keep a healthy model result",
    height: 110,
    weight: 18,
    aiStatus: "Above Average",
    medical: "No",
    expectedCategory: "Normal",
    allowedStatuses: ["Healthy", "Normal", "Above Average"],
  },
  {
    name: "overweight with low activity stays in review or above-average range",
    height: 125,
    weight: 32,
    aiStatus: "Underdeveloped",
    medical: "No",
    expectedCategory: "Overweight",
    allowedStatuses: ["Above Average", "Needs Review", "Overweight"],
    disallowedStatuses: ["Underdeveloped"],
  },
  {
    name: "underweight with medical condition needs attention",
    height: 128,
    weight: 22,
    aiStatus: "Healthy",
    medical: "Yes",
    expectedCategory: "Underweight",
    allowedStatuses: ["Underdeveloped", "Needs Attention"],
  },
];

for (const testCase of testCases) {
  const bmi = calculateBmi(testCase.height, testCase.weight);
  const bmiCategory = getBmiCategoryFromBmi(bmi);
  const finalStatus = normalizeGrowthStatusByBMI(
    bmiCategory,
    testCase.aiStatus,
    testCase.medical
  );

  assert.strictEqual(
    bmiCategory,
    testCase.expectedCategory,
    `${testCase.name}: expected BMI category ${testCase.expectedCategory}, got ${bmiCategory}`
  );

  assert(
    testCase.allowedStatuses.includes(finalStatus),
    `${testCase.name}: expected one of ${testCase.allowedStatuses.join(", ")}, got ${finalStatus}`
  );

  for (const disallowedStatus of testCase.disallowedStatuses || []) {
    assert.notStrictEqual(
      finalStatus,
      disallowedStatus,
      `${testCase.name}: final status must not be ${disallowedStatus}`
    );
  }
}

console.log("growth status BMI rule checks passed");
