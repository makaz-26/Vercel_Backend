// routes/referral.routes.js
const express = require("express");
const { body, param } = require("express-validator");
const router = express.Router();
const referralController = require("../Controllers/referral.controller");
const authMiddleware = require("../Middlewares/auth.middlewares");

router.get(
  "/stats",
  authMiddleware.authUser,
  referralController.getReferralStats
);

// Get Downline List at a Specific Level
router.get(
  "/downline/:level",
  [
    authMiddleware.authUser,
    param("level")
      .isInt({ min: 1, max: 10 })
      .withMessage("Level must be between 1 and 10"),
  ],
  referralController.getDownlineAtLevel
);

// Get Downline User Info at a Specific Level
router.get(
  "/downline-info/:level",
  [
    authMiddleware.authUser,
    param("level")
      .isInt({ min: 1, max: 10 })
      .withMessage("Level must be between 1 and 10"),
  ],
  referralController.getDownlineUserInfoAtLevel
);

// Payout Referral Earnings (claim referral balance)
router.post(
  "/payout",
  [
    authMiddleware.authUser,
    body("amount")
      .isFloat({ gt: 0 })
      .withMessage("Amount must be greater than 0"),
  ],
  referralController.payoutReferralReward
);

module.exports = router;
