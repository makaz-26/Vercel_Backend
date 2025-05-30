// controllers/referral.controller.js
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const User = require("../Models/User.model"); 

// Get Referral Stats
exports.getReferralStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const user=await User.findById(userId);
    if(!user){
      res.status(404).json({message:"User not found"})
    }

    
    const stats = user.getReferralStats();
    res.status(200).json(stats);
  } catch (err) {
    res.status(500).json({ message: "Failed to get referral stats", error: err.message });
  }
};

// Get Downline List at a Specific Level
exports.getDownlineAtLevel = async (req, res) => {
  const level = req.params.level;

  try {
    const userId = req.user.id;
    const user=await User.findById(userId);
    if(!user){
      res.status(404).json({message:"User not found"})
    }

    const downlines = user.getDownlineAtLevel(level);
    res.status(200).json({ level, downlines });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch downlines", error: err.message });
  }
};

// Get Downline User Info at a Specific Level
exports.getDownlineUserInfoAtLevel = async (req, res) => {
  const level = req.params.level;
  try {
    const userId = req.user.id;
    const user=await User.findById(userId)
    if(!user){
      res.status(404).json({message:"User not found"})
    }
    console.log("The referral logic",user)
    let downlineIds = user.getDownlineAtLevel(level);

    const users = await User.find(
      { referralCode: { $in: downlineIds } },
      { createdAt: 1, referralCode: 1, mobileNumber: 1 }
    ).lean();

    // Map users by referralCode for quick lookup
    const userMap = {};
    users.forEach(u => { userMap[u.referralCode] = u; });

    // Build result array preserving duplicates and order
    const result = downlineIds.map(code => userMap[code]).filter(Boolean);

    res.status(200).json({ level, users: result });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch downline user info", error: err.message });
  }
};

// Payout Referral Reward
exports.payoutReferralReward = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const user = req.user;
    const { amount } = req.body;

    if (amount > user.totalReferralEarning || amount > user.balance) {
      return res.status(400).json({ message: "Insufficient referral balance" });
    }

    user.totalReferralEarning -= amount;
    user.balance -= amount;
    user.withdrawableAmount += amount;

    user.calculateTotalEarnings();
    await user.save();

    res.status(200).json({ message: "Referral payout successful", newBalance: user.balance });
  } catch (err) {
    res.status(500).json({ message: "Payout failed", error: err.message });
  }
};

// Distribute Referral Earnings
exports.distributeReferralEarnings = async (userId, earnings) => {
  try {
    // Fetch the user and their uplines
    const user = await User.findById(userId).lean();
    if (!user || !user.uplines || user.uplines.length === 0) {
      console.log("No uplines found for user", userId);
      return;
    }

    // Predefined percentages for each level
    const referralPercentages = [0.1, 0.05, 0.02]; 

    // Distribute earnings to uplines
    for (let i = 0; i < user.uplines.length && i < referralPercentages.length; i++) {
      const uplineId = user.uplines[i];
      const percentage = referralPercentages[i];
      const referralEarning = earnings * percentage;

      // Update upline's referral earnings and balance
      const upline = await User.findById(uplineId);
      if (upline) {
        upline.totalReferralEarning = (upline.totalReferralEarning || 0) + referralEarning;
        upline.balance = (upline.balance || 0) + referralEarning;
        await upline.save();

        console.log(`Distributed ${referralEarning} to upline ${uplineId} at level ${i + 1}`);
      }
    }
  } catch (err) {
    console.error("Failed to distribute referral earnings", err);
  }
};
