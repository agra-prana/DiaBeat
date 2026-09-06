/**
 * Health & Biometric Calculation Engine for DiaBeat
 * 
 * Provides evidence-based calculations for BMR (Basal Metabolic Rate),
 * TDEE (Total Daily Energy Expenditure), Net Calories, Ideal Water Intake,
 * and Diabetes Risk stratification algorithms.
 */

// Harris-Benedict formula (Revised by Roza and Shizgal)
export const calculateBMR = (weightKg, heightCm, ageYears, gender = 'male') => {
  if (!weightKg || !heightCm || !ageYears) return 1600; // default baseline

  if (gender === 'female') {
    return Math.round(447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * ageYears));
  }
  // Default to male / standard
  return Math.round(88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * ageYears));
};

// TDEE based on activity level
export const calculateTDEE = (bmr, activityLevel = 'moderate') => {
  const multipliers = {
    sedentary: 1.2,       // Little to no exercise
    light: 1.375,         // Light exercise 1-3 days/week
    moderate: 1.55,       // Moderate exercise 3-5 days/week
    active: 1.725,        // Hard exercise 6-7 days/week
    very_active: 1.9,     // Intense daily training
  };
  return Math.round(bmr * (multipliers[activityLevel] || 1.55));
};

// Daily Water Intake target in Liters (35ml per kg of bodyweight + exercise compensation)
export const calculateWaterTargetLiters = (weightKg, burnedCalories = 0) => {
  const baseLiters = (weightKg ? weightKg * 0.035 : 2.5);
  const exerciseBonus = (burnedCalories / 500) * 0.35; // 350ml per 500 kcal burned
  return Number((baseLiters + exerciseBonus).toFixed(1));
};

// Algorithmic Diabetes & Metabolic Risk Assessment (Fallback if offline)
export const calculateDiabetesRisk = ({ bmi, age, activitySteps, netCalories, sleepHours }) => {
  let riskPoints = 0;

  // BMI score
  if (bmi >= 30) riskPoints += 3;
  else if (bmi >= 25) riskPoints += 2;
  else if (bmi < 18.5) riskPoints += 1;

  // Age score
  if (age >= 45) riskPoints += 2;
  else if (age >= 35) riskPoints += 1;

  // Sedentary / Steps
  if (activitySteps < 4000) riskPoints += 2;
  else if (activitySteps < 7000) riskPoints += 1;

  // Caloric surplus
  if (netCalories > 800) riskPoints += 2;
  else if (netCalories > 400) riskPoints += 1;

  // Sleep deficit
  if (sleepHours < 6) riskPoints += 1;

  if (riskPoints >= 5) {
    return {
      level: 'Tinggi',
      color: 'text-red-500',
      bgColor: 'bg-red-500/15',
      advice: 'Tingkatkan aktivitas fisik harian dan kurangi asupan karbohidrat sederhana untuk menjaga sensitivitas insulin.',
    };
  } else if (riskPoints >= 3) {
    return {
      level: 'Sedang',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/15',
      advice: 'Jaga konsistensi jalan kaki minimal 7.000 langkah dan perhatikan kualitas istirahat.',
    };
  }
  return {
    level: 'Rendah',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    advice: 'Metabolisme dan pola hidup dalam batas optimal. Pertahankan ritme ini!',
  };
};

// Calculate BMI (Body Mass Index)
export const calculateBMI = (weightKg, heightCm) => {
  if (!weightKg || !heightCm || heightCm <= 0) return { bmi: 22, category: 'Normal' };
  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));
  let category = 'Normal';
  if (bmi < 18.5) category = 'Kurang';
  else if (bmi >= 25 && bmi < 30) category = 'Kelebihan';
  else if (bmi >= 30) category = 'Obesitas';
  return { bmi, category };
};
