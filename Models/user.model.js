const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    activeAccounts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankDetail",
      index: true
    }],
    fullName: {
      type: String,

      trim: true,
      index: true,
      validate: {
        validator: function (v) {
          return /^.+$/.test(v); // Ensures fullName is not empty
        },
        message: () => `Full Name is required`,
      },
    },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: () => `Mobile number must be a 10-digit number`,
      },
    },

    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters long"],
    },
    avatar: {
      type: String, //Cloudinary url
    },

    referralCode: {
      type: String,
      unique: true,
      index: true,
    },

    referredBy: {
      type: String,
      index: true,
      validate: {
        validator: async function (v) {
          if (!v || v === this.referralCode) return false;

          // Prevent circular referrals
          let current = v;
          let level = 0;
          while (current && level < 10) {
            const user = await mongoose.models.User.findOne({
              referralCode: current,
            });
            if (!user || user.referredBy === this.referralCode) return false;
            current = user.referredBy;
            level++;
          }
          return true;
        },
        message: () => `Invalid or circular referral detected`,
      },
    },

    referralTree: {
      type: Map,
      of: [String],
      default: {},
    },

    referralEarnings: {
      type: Map,
      of: Number,
      default: {},
    },

    referralCount: {
      type: Map,
      of: Number,
      default: {},
    },

    referralTransactions: [
      {
        fromReferralCode: String,
        amount: Number,
        level: Number,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    totalReferralEarning: {
      type: Number,
      default: 0,
    },

    totalMiningEarning: {
      type: Number,
      default: 0,
    },

    totalEarning: {
      type: Number,
      default: 0,
    },

    balance: {
      type: Number,
      default: 0,
    },

    hasDeposited: {
      type: Boolean,
      default: false,
    },

    withdrawableAmount: {
      type: Number,
      default: 0,
    },

    superCoin: {
      type: Number,
      default: 0,
    },

    miningRate: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    ownedGpus: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "GpuCard",
      },
    ],

    otpHash: String,
    otpExpiresAt: Date,
    isOtpVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// OTP logic
userSchema.methods.generateOtp = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  this.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  return otp;
};

userSchema.methods.verifyOtp = function (otp) {
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  if (this.otpHash !== otpHash)
    return { success: false, message: "Invalid OTP" };
  if (this.otpExpiresAt < new Date())
    return { success: false, message: "OTP has expired" };
  this.isOtpVerified = true;
  return { success: true, message: "OTP verified successfully" };
};

// Step 1: Build Referral Tree
userSchema.statics.buildReferralTreeForNewUser = async function (user) {
  const UserModel = this;
  let currentReferral = user.referredBy;
  let level = 1;

  while (level <= 1 && currentReferral) {
    const upline = await UserModel.findOne({ referralCode: currentReferral });
    if (!upline) break;

    const tree = upline.referralTree.get(level.toString()) || [];
    // Prevent duplication in referralTree
    if (!tree.includes(user.referralCode)) {
      tree.push(user.referralCode);
      upline.referralTree.set(level.toString(), tree);

      // Increment referralCount only if added to the tree
      const count = upline.referralCount.get(level.toString()) || 0;
      upline.referralCount.set(level.toString(), count + 1);
    }

    await upline.save();
    currentReferral = upline.referredBy;
    level++;
  }
};

// Step 2: Distribute Earnings
userSchema.statics.distributeToUplines = async function (
  userReferralCode,
  totalAmount
) {
  const User = this;
  const levelPercentages = {
    1: 0.1,
    2: 0.05,
    3: 0.02,
    4: 0.01,
    5: 0.005,
    6: 0.005,
    7: 0.005,
    8: 0.005,
    9: 0.002,
    10: 0.002,
  };

  // Find the depositor
  const depositor = await User.findOne({ referralCode: userReferralCode });
  let currentReferral = depositor ? depositor.referredBy : null;
  let level = 1;

  while (level <= 1 && currentReferral) {
    const uplineUser = await User.findOne({ referralCode: currentReferral });
    if (!uplineUser) break;

    const percentage = levelPercentages[level] || 0;
    const earning = Math.floor(totalAmount * percentage);
    if (earning > 0) {
      uplineUser.addReferralEarningAtLevel(level, earning);
      uplineUser.referralTransactions.push({
        fromReferralCode: userReferralCode,
        amount: earning,
        level,
      });
      await uplineUser.save();
    }

    currentReferral = uplineUser.referredBy;
    level++;
  }
};

// Step 3: Add Earnings at Level
userSchema.methods.addReferralEarningAtLevel = function (level, amount) {
  const current = this.referralEarnings.get(level.toString()) || 0;
  const updated = current + amount;

  this.referralEarnings.set(level.toString(), updated);
  this.totalReferralEarning += amount;
  this.balance += amount;
  this.calculateTotalEarnings();
};

// Step 4: Get Referral Stats
userSchema.methods.getReferralStats = function () {
  const stats = [];
  for (let i = 1; i <= 1; i++) {
    const level = i.toString();
    stats.push({
      level: i,
      referrals: this.referralTree.get(level)?.length || 0,
      earnings: this.referralEarnings.get(level) || 0,
    });
  }

  return {
    totalReferrals: this.referralTree,
    totalReferralEarning: this.totalReferralEarning,
    totalEarning: this.totalEarning,
    levels: stats,
  };
};

userSchema.methods.getDownlineAtLevel = function (level) {
  return this.referralTree.get(level.toString()) || [];
};


//Get Mining History of a specific user





// Calculate total earnings (This is a method to calculate total Earnings and calculated in cron job)
userSchema.methods.calculateTotalEarnings = function () {
  this.totalEarning = this.totalMiningEarning + this.totalReferralEarning;
  return this.totalEarning;
};

userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generate access token for user
userSchema.methods.generateAccessToken = function () {
  const accessToken = jwt.sign(
    { id: this._id, role: "user" },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  return accessToken;
};
//Generate refresh token for user
userSchema.methods.generateRefreshToken = function () {
  const refreshToken = jwt.sign(
    { id: this._id, role: "user" },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
  );
  return refreshToken;
};

userSchema.statics.generateReferralCode = function () {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
};

const User = mongoose.models.User || mongoose.model("User", userSchema);
module.exports = User;
