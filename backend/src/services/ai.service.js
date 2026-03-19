export const calculateMatchScore = (userPrefs, property) => {
  let score = 0;
  // Match by budget
  if (property.basePrice <= userPrefs.maxBudget) score += 40;
  // Match by category
  if (userPrefs.preferredCategory === property.category) score += 30;
  // Match by Safety Metrics
  if (property.safetyMetrics.cctv) score += 15;
  if (property.safetyMetrics.powerBackup) score += 15;
  
  return score; // Out of 100
};