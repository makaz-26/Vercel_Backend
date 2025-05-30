const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const bankDetailController = require("../Controllers/bank.detail.controller");
const authMiddleware = require("../Middlewares/auth.middlewares");

// Add a Bank Withdrawal Method
router.post(
  "/addBank",
  authMiddleware.authUser,
  [
    body("method")
      .equals("BANK")
      .withMessage("Method must be 'BANK'"),

    body("bankName")
      .notEmpty().withMessage("Bank name is required")
      .isString().withMessage("Bank name must be a string")
      .isLength({ min: 3 }).withMessage("Bank name must be at least 3 characters long"),

    body("recipientName")
      .notEmpty().withMessage("Recipient name is required")
      .isString().withMessage("Recipient name must be a string")
      .isUppercase().withMessage("Recipient name must be in uppercase")
      .isLength({ min: 3 }).withMessage("Recipient name must be at least 3 characters long"),

    body("accountNumber")
      .notEmpty().withMessage("Account number is required")
      .isNumeric().withMessage("Account number must be numeric")
      .isLength({ min: 9, max: 18 }).withMessage("Account number must be between 9 to 18 digits"),

    body("ifscCode")
      .notEmpty().withMessage("IFSC code is required")
      .isLength({ min: 11, max: 11 }).withMessage("IFSC code must be exactly 11 characters")
      .matches(/^[A-Z]{4}[0-9]{7}$/).withMessage("Invalid IFSC code format"),
  ],
  bankDetailController.addBankDetail
);

// Add a Binance Address
router.post(
  "/addBinance",
  authMiddleware.authUser,
  [
    body("method")
      .equals("BINANCE")
      .withMessage("Method must be 'BINANCE'"),

    body("binanceAddress")
      .notEmpty().withMessage("Binance address is required")
      .isString().withMessage("Binance address must be a string")
      .isLength({ min: 10 }).withMessage("Binance address must be at least 10 characters"),
  ],
  bankDetailController.addBinanceAddress
);

// Get all active bank details of a user
router.get("/getAllBank", authMiddleware.authUser, bankDetailController.getAllBankDetails);

// Get all Binance addresses of a user
router.get("/getAllBinance", authMiddleware.authUser, bankDetailController.getAllBinanceAddresses);




module.exports = router;
