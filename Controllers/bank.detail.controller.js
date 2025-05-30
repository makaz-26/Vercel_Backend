const BankDetail = require("../Models/bankdetails.model");
const User = require("../Models/user.model");
const bankDetailService = require("../Services/bank.detail.service");

module.exports.addBankDetail = async (req, res) => {
  try {
    // Add debugging logs to identify issues
    console.log("Request body:", req.body);
    console.log("Authenticated user:", req.user);

    const { bankName, recipientName, accountNumber, email, ifscCode } = req.body;
    const userId = req.user.id;

    // Input validation
    if (!bankName || !recipientName || !accountNumber || !email || !ifscCode) {
      return res.status(400).json({ 
        message: "All fields are required",
        required: ["bankName", "recipientName", "accountNumber", "email", "ifscCode"]
      });
    }

    // Find user and explicitly select activeAccounts
    const user = await User.findById(userId).select('+activeAccounts');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Log user details after fetching from the database
    console.log("User found:", user);

    // Initialize activeAccounts if it doesn't exist
    if (!user.activeAccounts) {
      user.activeAccounts = [];
    }

    // Check for existing account
    const existingAccount = await BankDetail.findOne({ accountNumber });
    if (existingAccount) {
      // Log existing account details if found
      console.log("Existing account:", existingAccount);
      return res.status(400).json({ message: "Account number already exists" });
    }

    // Create bank detail
    const newBankDetail = new BankDetail({
      user: userId,
      bankName,
      recipientName,
      accountNumber,
      email,
      ifscCode,
      method:"BANK"
    });

    // Log new bank detail before saving
    console.log("New bank detail to save:", newBankDetail);

    // Save bank detail
    await newBankDetail.save();

    // Update user's activeAccounts
    user.activeAccounts.push(newBankDetail._id);
    await user.save();

    // Verify the update by fetching the updated user
    const updatedUser = await User.findById(userId)
      .select('+activeAccounts')
      .populate('activeAccounts');

    // Log updated user details after saving
    console.log("Updated user details:", updatedUser);

    // Log the successful update
    console.log('Bank detail added successfully:', {
      bankId: newBankDetail._id,
      userId: userId,
      activeAccounts: updatedUser.activeAccounts
    });

    return res.status(201).json({
      message: "Bank details added successfully",
      data: newBankDetail,
      user: {
        id: updatedUser._id,
        activeAccounts: updatedUser.activeAccounts
      }
    });

  } catch (error) {
    console.error("Error in addBankDetail:", error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Duplicate bank account",
        field: Object.keys(error.keyPattern)[0]
      });
    }

    return res.status(500).json({ 
      message: "Failed to add bank account",
      error: error.message 
    });
  }
};





module.exports.getAllBankDetails = async (req, res) => {
  try {
    const userId = req.user.id;

    const bankDetails = await BankDetail.find({ user: userId }).sort({
      createdAt: -1,
    });
    console.log("Bank details", bankDetails);

    if (!bankDetails || bankDetails.length === 0) {
      return res.status(404).json({ message: "No bank details found" });
    }

    return res.status(200).json({
      message: "Bank details fetched successfully",
      data: bankDetails,
    });
  } catch (err) {
    console.error("Error in getAllBankDetails controller:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};




module.exports.addBinanceAddress = async (req, res) => {
  try {
    const { binanceAddress } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!binanceAddress) {
      return res.status(400).json({ message: "Binance address is required" });
    }

    // Find user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check for duplicate Binance address
    const existing = await BankDetail.findOne({ binanceAddress, method: "BINANCE" });
    if (existing) {
      return res.status(400).json({ message: "Binance address already exists" });
    }

    // Create new Binance address entry
    const newBinance = new BankDetail({
      user: userId,
      method: "BINANCE",
      binanceAddress,
    });
    await newBinance.save();

    // Add to user's active accounts
    user.activeAccounts = user.activeAccounts || [];
    user.activeAccounts.push(newBinance._id);
    await user.save();

    return res.status(201).json({
      message: "Binance address added successfully",
      data: newBinance,
    });

  } catch (error) {
    console.error("Error in addBinanceAddress:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Duplicate entry",
        field: Object.keys(error.keyPattern)[0]
      });
    }

    return res.status(500).json({
      message: "Failed to add Binance address",
      error: error.message,
    });
  }
};

module.exports.getAllBinanceAddresses = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all Binance addresses for the authenticated user
    const binanceAddresses = await BankDetail.find({ 
      user: userId, 
      method: "BINANCE" 
    }).sort({ createdAt: -1 });

    if (!binanceAddresses || binanceAddresses.length === 0) {
      return res.status(404).json({ message: "No Binance addresses found" });
    }

    return res.status(200).json({
      message: "Binance addresses fetched successfully",
      data: binanceAddresses,
    });
  } catch (error) {
    console.error("Error in getAllBinanceAddresses:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

