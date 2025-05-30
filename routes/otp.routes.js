const express = require("express");
const { body } = require("express-validator");
const otpController = require("../controllers/otp.controller");

const router = express.Router();

// Send OTP
router.post(
  "/send-otp",
  [
    body("mobileNumber")
      .isNumeric()
      .withMessage("Mobile must be numeric")
      .isLength({ min: 10, max: 10 })
      .withMessage("Mobile must be 10 digits"),
  ],
  otpController.sendOtp
);

//Resend Otp(reuses send otp Logic)
router.post(
  "/resend-otp",
  [
    body("mobileNumber")
      .isNumeric()
      .withMessage("Mobile must be numeric")
      .isLength({ min: 10, max: 10 })
      .withMessage("Mobile must be 10 digits"),
  ],
  otpController.sendOtp
);

// Verify OTP
router.post(
  "/verify-otp",
  [
    body("mobileNumber")
      .isNumeric()
      .withMessage("Mobile must be numeric")
      .isLength({ min: 10, max: 10 })
      .withMessage("Mobile must be 10 digits"),
    body("otp")
      .isNumeric()
      .withMessage("OTP must be numeric")
      .isLength({ min: 4, max: 6 })
      .withMessage("OTP must be between 4-6 digits"),
  ],
  otpController.verifyOtp
);

module.exports = router;
