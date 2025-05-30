const gpuPlans = require("../utils/gpuPlans");
const fs = require("fs");
const path = require("path");

const plansFilePath = path.join(__dirname, "../utils/gpuPlans.js");

// Get all GPU plans
exports.getPlans = async (req, res) => {
  try {
    res.status(200).json(gpuPlans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Add a new GPU plan
exports.addPlan = async (req, res) => {
  try {
    const newPlan = req.body;
    gpuPlans.push(newPlan);

    // Update the static file
    const updatedPlans = `const gpuPlans = ${JSON.stringify(gpuPlans, null, 2)};\n\nmodule.exports = gpuPlans;`;
    fs.writeFileSync(plansFilePath, updatedPlans);

    res.status(201).json({ message: "Plan added successfully", newPlan });
  } catch (error) {
    console.error("Error adding plan:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update an existing GPU plan
exports.updatePlan = async (req, res) => {
  try {
    const { planCost } = req.params;
    const updatedPlan = req.body;

    const planIndex = gpuPlans.findIndex(p => p.planCost === parseInt(planCost));
    if (planIndex === -1) return res.status(404).json({ message: "Plan not found" });

    gpuPlans[planIndex] = { ...gpuPlans[planIndex], ...updatedPlan };

    // Update the static file
    const updatedPlans = `const gpuPlans = ${JSON.stringify(gpuPlans, null, 2)};\n\nmodule.exports = gpuPlans;`;
    fs.writeFileSync(plansFilePath, updatedPlans);

    res.status(200).json({ message: "Plan updated successfully", updatedPlan });
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete a GPU plan
exports.deletePlan = async (req, res) => {
  try {
    const { planCost } = req.params;

    const planIndex = gpuPlans.findIndex(p => p.planCost === parseInt(planCost));
    if (planIndex === -1) return res.status(404).json({ message: "Plan not found" });

    const deletedPlan = gpuPlans.splice(planIndex, 1);

    // Update the static file
    const updatedPlans = `const gpuPlans = ${JSON.stringify(gpuPlans, null, 2)};\n\nmodule.exports = gpuPlans;`;
    fs.writeFileSync(plansFilePath, updatedPlans);

    res.status(200).json({ message: "Plan deleted successfully", deletedPlan });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
