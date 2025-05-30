const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const gpuCardController = require("../Controllers/gpuCard.controller");
const authMiddleware = require("../Middlewares/auth.middlewares");






// Buy a GPU Card
router.post(
  "/buy",
  authMiddleware.authUser,
  [body("planCost").isNumeric().withMessage("Invalid plan cost")],
  gpuCardController.buyGpuCard
);

// Upgrade a GPU Card
router.post(
  "/upgrade",
  authMiddleware.authUser,

  [
    body("currentPlanCost")
      .isNumeric()
      .withMessage("Invalid current plan cost"),
    body("nextPlanCost").isNumeric().withMessage("Invalid next plan cost"),
  ],
  gpuCardController.upgradeGpuCard
);

//Get all Gpu Cards of a specific User
router.get('/allGpuUser',authMiddleware.authUser,gpuCardController.getAllGpuUser);






module.exports = router;
