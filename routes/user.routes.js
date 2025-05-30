const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");

const userController = require("../Controllers/user.controller");
const authMiddleware = require("../Middlewares/auth.middlewares");
const { refreshAccessToken } = require("../Middlewares/auth.middlewares");
const { upload } = require("../middlewares/multer.middleware");

// Middleware to handle validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(" Validation failed:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};



//  Refresh Access Token
router.post("/refresh-token", refreshAccessToken);

//  User Registration
router.post(
  "/register",
  [
    body("mobileNumber")
      .isString()
      .withMessage("Mobile number must be a string")
      .matches(/^\d{10}$/)
      .withMessage("Mobile number must be exactly 10 digits"),

    body("otp")
      .isString()
      .withMessage("OTP must be a string")
      .matches(/^\d{6}$/)
      .withMessage("OTP must be exactly 6 digits"),

    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),

    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Confirm Password must match Password");
      }
      return true;
    }),

    body("referredBy")
      .optional()
      .isString()
      .withMessage("Referral code must be a string"),

    validate,
  ],
  userController.registerUser
);

//  User Login
router.post(
  "/login",
  [
    body("mobileNumber")
      .isString()
      .withMessage("Mobile number must be a string")
      .matches(/^\d{10}$/)
      .withMessage("Mobile number must be exactly 10 digits"),

    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),

    validate,
  ],
  userController.loginUser
);

//  Add Bank Account
// router.post(
//   "/bank/add",
//   [
//     authMiddleware.authUser,

//     body("bankName").notEmpty().withMessage("Bank name is required"),
//     body("accountNumber").notEmpty().withMessage("Account number is required"),
//     body("ifsc").notEmpty().withMessage("IFSC code is required"),
//     body("upiId").optional(),
//     body("accountType")
//       .isIn(["savings", "current"])
//       .withMessage("Account type must be savings or current"),

//     validate,
//   ],
//   userController.addBankAccount
// );

//  Get User Profile
router.get("/profile", authMiddleware.authUser, userController.getUserProfile);

//  Upload Profile Avatar (POST and PUT supported)
router.post(
  "/profile/avatar",
  authMiddleware.authUser,
  upload.single("avatar"),
  userController.uploadProfileImage
);

router.put(
  "/profileUpdate/avatar",
  authMiddleware.authUser,
  upload.single("avatar"),
  userController.uploadProfileImage
);

//Get all Gpu Plans

router.get("/gpu-plans",authMiddleware.authUser,userController.getAllGpuPlans);


//Change Password
router.patch('/change-password',authMiddleware.authUser,userController.changePassword)






//  Logout
router.post("/logout", userController.logoutUser);

module.exports = router;
