const { validationResult } = require("express-validator");

const User = require("../Models/user.model");
const axios = require("axios");

module.exports.sendOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { mobileNumber } = req.body;
  console.log("Incoming request to send OTP for mobileNumber:", mobileNumber);

  try {
    // Find or create the user
    let user = await User.findOne({ mobileNumber });
    if (!user) {
      console.log("User not found, creating a new user...");
      user = new User({ mobileNumber });
    }

    // Generate OTP
    const otp = user.generateOtp();
    console.log("Generated OTP:", otp); // Log the OTP for testing
    await user.save();
    console.log("User saved with OTP.");

    // Mock sending OTP (log it instead of sending via SMS)
    console.log(`Mock OTP sent to ${mobileNumber}: ${otp}`);

    // Return success response
    res.status(200).json({ message: "OTP sent successfully", otp }); // Include OTP in response for testing
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

//Verify otp
module.exports.verifyOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { mobileNumber, otp } = req.body;

  try {
    // Find the user
    const user = await User.findOne({ mobileNumber });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
 

    // Verify OTP
    const otpResult = user.verifyOtp(otp);
    if (!otpResult.success) {
      return res.status(400).json({ message: otpResult.message });
    }

    // Save the user after successful OTP verification
    await user.save();

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};
