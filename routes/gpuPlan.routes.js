const express = require("express");
const router = express.Router();
const gpuPlanController = require("../Controllers/gpuPlan.controller");
const adminAuth = require("../Middlewares/admin.auth.middleware");
const authMiddleware = require("../Middlewares/auth.middlewares");


router.get("/",authMiddleware.authUser,adminAuth ,gpuPlanController.getPlans);
router.post("/",authMiddleware.authUser,adminAuth,gpuPlanController.addPlan);
router.put("/:planCost", authMiddleware.authUser,adminAuth,gpuPlanController.updatePlan);
router.delete("/:planCost", authMiddleware.authUser,adminAuth,gpuPlanController.deletePlan);

module.exports = router;
