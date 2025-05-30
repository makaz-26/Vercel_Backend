const User = require("../Models/user.model");
const { validationResult } = require("express-validator");
const { uploadOnCloudinary } = require("../utils/cloudinary");
const gpuPlans = require("../utils/gpuPlans");
const fs = require("fs");
const path = require("path");

// const plansFilePath = path.join(__dirname, "../utils/gpuPlans.js");
const plansFilePath=path.join(__dirname,"../utils/gpuPlans.js")

// Get all GPU plans
exports.getAllGpuPlans = async (req, res) => {
  try {
    res.status(200).json(gpuPlans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.registerUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { mobileNumber, otp, password, referral } = req.body;

  try {
    const existingUser = await User.findOne({ mobileNumber });
    if (!existingUser) {
      return res
        .status(400)
        .json({ message: "User not found. Please request an OTP first." });
    }

    if (existingUser.isOtpVerified && existingUser.password) {
      return res
        .status(409)
        .json({ message: "User already registered. Please login." });
    }

    const { success, message } = existingUser.verifyOtp(otp);
    if (!success) {
      return res.status(400).json({ message });
    }

    existingUser.isOtpVerified = true;
    existingUser.otpHash = undefined;

    //Always generates  a referral code for the new User
    if (!existingUser.referralCode) {
      existingUser.referralCode = User.generateReferralCode();
    }

    // //Referral required for registration purpose
    if (!referral) {
      return res
        .status(400)
        .json({ messsage: "Referral code is required for resgistration " });
    }
    const referringUser = await User.findOne({ referralCode: referral });
    existingUser.referredBy = referringUser.referralCode;

    existingUser.password = await User.hashPassword(password);

    await existingUser.save();

    // Build referral tree for uplines
    await User.buildReferralTreeForNewUser(existingUser);

    const accessToken = existingUser.generateAccessToken();
    const refreshToken = existingUser.generateRefreshToken();
    console.log("The refresh token is ", refreshToken);
    if (!refreshToken) {
      return res
        .status(401)
        .json({ message: "Refresh Token not generated for the user" });
    }
    existingUser.refreshToken = refreshToken;
    await existingUser.save();

    // In registerUser, change this:
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // <--- CHANGE TO false FOR LOCALHOST
      sameSite: "Lax", // <--- MATCH loginUser
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: "User registered successfully",
      accessToken,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    next(error);
  }
};

// User Login

module.exports.loginUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { mobileNumber, password } = req.body;

  try {
    // Find the user
    const user = await User.findOne({ mobileNumber });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid mobile number or password" });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Invalid mobile number or password" });
    }

    // Generate JWT token
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    //Save refreshToken in the db after every login
    user.refreshToken = refreshToken;
    await user.save();

    // Set HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // OK for localhost
      sameSite: "Lax", // or "None" with secure: true if on HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // optional: 7 days
    });

    // Respond
    return res.status(200).json({ accessToken: accessToken });
  } catch (error) {
    console.error("Error logging in user:", error);
    next(error);
  }
};

// Get User Profile

module.exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Calculate total earnings before sending the response
    user.calculateTotalEarnings();

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


//Get All Gpu Plans
// module.exports.getAllGpuPlans=async(req,res)=>{
//   try{
//     const

//   }
//   catch(error){
//     console.log("Error i getting All Gpu Plans",error?.message);
//     returnres.status(500).json({message:"Internal Server Error"})
//   }
// }



//Change Password
module.exports.changePassword=async(req,res)=>{
  try{
    const userId=req.user.id;
    const user=await User.findById(userId);
    if(!user){
      return res.status(404).json({message:"User not found"})
    }

    const {oldPassword,newPassword}=req.body;
    const isMatch=await user.comparePassword(oldPassword);
    if(!isMatch){
      return res.status(401).json({message:"Old password is incorrect"})
    }
    user.password=await User.hashPassword(newPassword);
    await user.save();
    return res.status(200).json({message:"Password updated successfully"})

  }
   catch(error){
    console.log("Error in changePassword",error?.message);
    return res.status(500).json({message:"Internal Server Error"})
    
   }
}








// Logout User

module.exports.logoutUser = async (req, res, next) => {
  try {
    let userId = req.user?.id;
    // If not available, try to get user by refresh token
    if (!userId && req.cookies.refreshToken) {
      const user = await User.findOne({
        refreshToken: req.cookies.refreshToken,
      });
      userId = user?._id;
    }
    if (userId) {
      await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
    } else if (req.cookies.refreshToken) {
      // Fallback: clear refreshToken for any user with this token
      await User.updateMany(
        { refreshToken: req.cookies.refreshToken },
        { $unset: { refreshToken: 1 } }
      );
    }
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    });
    return res.status(200).json({ message: "Logged out" });
  } catch (error) {
    return res.status(500).json({ message: "Logout failed" });
  }
};
//upload Profile Image
//This function is used to upload the profile image of the user in cloudinary
module.exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const result = await uploadOnCloudinary(req.file.path);
    if (!result) {
      return res.status(500).json({ message: "Cloudinary upload failed" });
    }
    // Update user avatar
    const userId = req.user._id || req.user.id; // Support both _id and id
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: result.secure_url },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res
      .status(200)
      .json({ avatar: result.secure_url, message: "Profile image updated" });
  } catch (error) {
    return res.status(500).json({ message: "Image upload failed" });
  }
};
