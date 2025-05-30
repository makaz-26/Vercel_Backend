const User = require("../Models/user.model");
const Transaction = require("../Models/transaction.model");
const Admin = require("../Models/admin.model");
const bcrypt = require("bcryptjs");

exports.createAdmin = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;
    if (!mobileNumber || !password) {
      return res
        .status(400)
        .json({ message: "Mobile number and password required" });
    }
    // Check if admin already exists
    const existing = await Admin.findOne({ mobileNumber });
    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = new Admin({
      mobileNumber,
      password,
    });
    await admin.save();
    res.status(201).json({
      message: "Admin created",
      admin: { mobileNumber, name: admin.name },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create admin", error: error.message });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;
    if (!mobileNumber || !password) {
      return res
        .status(400)
        .json({ message: "Please provide mobile Number and passsword" });
    }
    const admin = await Admin.findOne({ mobileNumber }).select("+password");

    if (!admin) {
      return res.status(404).json({ message: "Admin Not Found" });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    const accessToken = await admin.generateAccessToken();
    const refreshToken = await admin.generateRefreshToken();

    // Configure cookie settings for local development
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // Must be false for HTTP in local development
      sameSite: "lax", // 'lax' is recommended for local development
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/", // Ensure cookie is available across your local domain
    });

    res.status(200).json({
      message: "Login Successfully",
      accessToken: accessToken,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.updatePassword = async (req, res) => {
  const adminId = req.user.id;
  console.log("The admin Id is", adminId);
  const { oldPassword, newPassword } = req.body;

  const admin = await Admin.findById(adminId).select("+password");
  if (!admin) return res.status(404).json({ message: "Admin not found" });

  const isMatch = await admin.comparePassword(oldPassword);
  if (!isMatch)
    return res.status(400).json({ message: "Current password is incorrect" });

  admin.password = newPassword;
  await admin.save();

  res.json({ message: "Password changed successfully" });
};

// Get all users with count and details (excluding password)
module.exports.getUserList = async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    const count = await User.countDocuments();
    res.status(200).json({ count, users });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch UserList", error: error.message });
  }
};

// Get single user details (excluding password)
module.exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId, "-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch user details", error: error.message });
  }
};

// Update user info (name, mobile, wallet, etc.) and/or password and/or active status Optional
module.exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = { ...req.body };

    // If password is being updated, hash it
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      select: "-password",
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update user", error: error.message });
  }
};

//setUserActive Status

module.exports.setUserActiveStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be boolean" });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true, select: "-password" }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update user status", error: error.message });
  }
};

module.exports.getWithdrawHistory = async (req, res) => {
  try {
    const withdraws = await Transaction.find(
      { type: "withdrawal", status: { $in: ["completed", "rejected"] } }
    )
      .populate("user", "mobileNumber,name")
      .populate("bankId", " method bankName accountNumber ifscCode binanceAddress recipientName")
      .sort({ createdAt: -1 });
      


    res.status(200).json({
      message: "Withdraw History fetched successfully",
      withdraws: withdraws.map((txn, index) => {
        return {
          sr: index + 1,
          mobile: txn.user?.mobileNumber || "N/A",
          method :txn.method,
          bankName:txn.bankId?.bankName || "N/A",
          accountNumber:txn.bankId?.accountNumber || "N/A",
          ifscCode:txn.bankId?.ifscCode || "N/A",
          binanceAddress:txn.bankId?.binanceAddress || "N/A",
          name: txn.bankId?.recipientName || "N/A",
          amount: txn.amount,
          requestDate: txn.createdAt.toISOString().split("T")[0],
          status: txn.status,

          transactionId: txn.transactionId,
          adminNote: txn.adminNote || "N/A"
        };
      })
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch the withdraw History",
      error: error.message,
    });
  }
};

// Get latest deposit history (sorted by newest first)
module.exports.getDepositHistory = async (req, res) => {
  try {
    const deposits = await Transaction.find({ type: "deposit" ,status:{$in:["completed","rejected"]}})
      .populate("user", "mobileNumber name balance")
      .sort({ createdAt: -1 })
    
    res.status(200).json({
      message: "Deposit history fetch Successfully",
      deposits: deposits.map((txn, index) => {
        return {
          sr: index + 1,
          mobile: txn.user?.mobileNumber || "N/A",
          balance: txn.user?.balance || "N/A",
          amount: txn.amount,
          requestDate: txn.createdAt.toISOString().split("T")[0],
          status: txn.status === "completed" ? "Completed" : txn.status === "rejected" ? "Rejected" : "Pending",
          transactionId: txn.transactionId,
          adminNote: txn.adminNote || "N/A"

        }
      })

    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch deposit history",
      error: error.message,
    });
  }
};

//Admin add funds to the user Account and also activate referral bonus if the user is new and on first deposit
module.exports.adminApproveDeposit = async (req, res) => {
  try {
    console.log("Request received for adminApproveDeposit");
    const { transactionId } = req.body;
    if (!transactionId) {
      console.log("Transaction ID is missing");
      return res.status(400).json({ message: "Transaction Id is required" });
    }

    console.log("Finding transaction with ID:", transactionId);
    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      console.log("Transaction not found");
      return res.status(400).json({ message: "Transaction is not found" });
    }

    console.log("Validating transaction type and status");
    if (transaction.type != "deposit") {
      console.log("Transaction is not a deposit");
      return res.status(400).json({ message: "Transaction is not a deposit" });
    }
    if (transaction.status != "pending") {
      console.log("Transaction is already approved or rejected");
      return res.status(400).json({ message: "Transaction is already approved or rejected" });
    }

    console.log("Fetching user associated with the transaction");
    const user = await User.findById(transaction.user);
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User is not found" });
    }

    console.log("Updating user balance");
    user.balance += transaction.amount;
    await user.save();

    if (user.referredBy && !user.hasDeposited) {
      try {
        console.log("Building referral tree and distributing earnings");
        await User.buildReferralTreeForNewUser(user);
        await User.distributeToUplines(user.referralCode, transaction.amount);

        console.log("Marking user as having deposited");
        user.hasDeposited = true;
        await user.save();
      } catch (error) {
        console.error("Error processing referral logic:", error);
        return res.status(500).json({ message: "Error processing referral logic", error: error.message });
      }
    }

    console.log("Updating transaction status to completed");
    transaction.status = "completed";
    transaction.isAdminApproved = true;
    transaction.adminNote = "Approved by Admin";
    transaction.balanceBefore = user.balance - transaction.amount;
    transaction.balanceAfter = user.balance;
    await transaction.save();

    console.log("Transaction approved successfully");
    res.status(200).json({ message: "Deposit approved successfully" });
  } catch (error) {
    console.error("Error in adminApproveDeposit:", error);
    res.status(500).json({ message: "Failed to approve deposit", error: error?.message });
  }
};
module.exports.adminRejectDeposit=async(req,res)=>{
  try{
    const {transactionId}=req.body;
    if(!transactionId){
      return res.status(400).json({message:"Transaction Id is required"})
    }
    const transaction=await Transaction.findOne({transactionId});
    if(!transaction){
      return res.status(404).json({message:"Transaction is not found"})
    }
    if(transaction.type!="deposit"){
      return res.status(400).json({message})
    }
    if(transaction.status != "pending") {
      return res.status(400).json({message:"Transaction is already approved or rejected"})
    }

    //Update the transaction status to be rejected
    const user=await User.findById(transaction.user);
    if(!user){
      return res.status(404).json({message :"User is not found"})
    }
    transaction.status="rejected";
    transaction.isAdminApproved=true;
    transaction.adminNote="Rejected by admin";
    transaction.balanceBefore=user.balance;
    transaction.balanceAfter=user.balance;
    await transaction.save();

    //Responsd wit success message
    res.status(200).json({
      message:"Deposit rejected successfully",
      transaction,
      userBalance:user.balance,
      balanceBefore:transaction.balanceBefore,
      balanceAfter:transaction.balanceAfter
    })

  }
  catch(error){
    res.status(500).json({message:"Failed to reject Deposit",error:error?.message})
  }

}

//Admin withdraw funds from the sysytem to the user account it can be tracked from User Id and it is alos neccesary to track the bank details of the user in which we are going to transfer the funds

//Admin Approve funds
module.exports.adminApproveWithdraw = async (req, res) => {
  try {
    const { transactionId } = req.body;
    if (!transactionId) {
      return res.status(400).json({ message: "Transaction Id is required" });
    }

    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction is not found" });
    }

    if (transaction.type != "withdrawal") {
      return res
        .status(400)
        .json({ message: "Transaction is not a withdrawal" });
    }
    if (transaction.status != "pending") {
      return res
        .status(400)
        .json({ message: "Transaction is already approved or rejected" });
    }
      console.log("Transaction User ID:", transaction.user); // Ensure it looks valid
    //Deduct the amount from the admin balance and add it to the user balance
    const user = await User.findById(transaction.user);
    console.log("The user is",user);
    if (!user) {
      return res.status(404).json({ message: "User is not found" });
    }
    if (user.balance < transaction.amount) {
      return res
        .status(400)
        .json({ message: "User does not have sufficient balance" });
    }
    user.balance -= transaction.amount;
    await user.save();

    //Mark transactions as completed
    transaction.status = "completed";
    transaction.isAdminApproved = true;
    transaction.adminNote = "Approved by admin";
    transaction.balanceAfter = user.balance;
    await transaction.save();

    res.status(200).json({
      message: "Funds withdrawn successfully",
      transaction,
      userBalance: user.balance,
      balanceBefore: user.balance + transaction.amount,

      balanceAfter: user.balance - transaction.amount,
      bankDetails: transaction.bankId,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to withdraw funds", error: error?.message });
  }
};
//Admin reject funds
module.exports.adminRejectWithdraw = async (req, res) => {
  try {
    const { transactionId } = req.body;
    if (!transactionId) {
      return res.status(400).json({ message: "Transaction Id is required" });
    }
    //Find the transaction
    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({ message: "Transaction is not found" });
    }
    //Validate the transaction
    if (transaction.type != "withdrawal") {
      return res
        .status(400)
        .json({ message: "Transaction is not a withdrawal" });
    }
    if (transaction.status != "pending") {
      return res
        .status(400)
        .json({ message: "Transaction is already approved or rejected" });
    }

    //Update transaction status to be rejected
    const user = await User.findById(transaction.user);
    transaction.status = "rejected";
    transaction.isAdminApproved = true;
    transaction.adminNote = "Rejected by admin";
    transaction.balanceBefore = user.balance;
    transaction.balanceAfter = user.balance;

    await transaction.save();

    //Respond with success message
    res.status(200).json({
      message: "Funds rejected Successfully",
      transaction,
      userBalance: user.balance,
      balanceBefore: transaction.balanceBefore,
      balanceAfter: transaction.balanceAfter,
    });
  } catch (error) {
    res
      .status(500)
      .josn({ message: "Failed to reject Funds", error: error?.message });
  }
};

module.exports.getAdminDashboardStats = async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments();

    // Total deposit amount
    const depositAgg = await Transaction.aggregate([
      { $match: { type: "deposit", status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalDeposit = depositAgg[0]?.total || 0;

    // Total withdrawal amount
    const withdrawAgg = await Transaction.aggregate([
      { $match: { type: "withdrawal", status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalWithdraw = withdrawAgg[0]?.total || 0;

    // Total wallet balance  sum of all user balance
    const walletAgg = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$balance" } } },
    ]);
    const totalWalletBalance = walletAgg[0]?.total || 0;

    res.status(200).json({
      totalUsers,
      totalDeposit,
      totalWithdraw,
      totalWalletBalance,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch dashboard stats",
      error: error.message,
    });
  }
};
exports.adminLogout = async (req, res) => {
  try {
    // Clear the refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true, // Use true in production (requires HTTPS)
      sameSite: "strict",
    });

    // Send a success response
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during admin logout:", error.message);
    res.status(500).json({ message: "Failed to log out" });
  }
};

//Request for deposit Data to ab approved or cancelled By Admin
exports.getDepositData = async (req, res) => {
  try {
    const depositData = await Transaction.find({ type: "deposit" })
      .populate("user", "mobileNumber amount transactionIdQr")
      .sort({ createdAt: -1 });

    const formattedData = depositData.map((txn, index) => ({
      sr: index + 1,
      mobile: txn.user?.mobileNumber || "N/A",
      amount: txn.amount,
      requestDate: txn.createdAt.toISOString().split("T")[0],
      status:
        txn.status === "completed"
          ? "Completed"
          : txn.status === "rejected"
          ? "Rejected"
          : "Pending",
      transactionId: txn.transactionId,
      transactionIdQr: txn.transactionIdQr,
    }));

    return res.status(200).json({
      message: "Deposit list fetched",
      data: formattedData,
    });
  } catch (error) {
    console.error("The error is", error?.message);
    res.status(500).json({ message: "There is no deposit data" });
  }
};

//Reuest for withdraw Data To be approved or cancelled By admin
exports.getWithdrawData = async (req, res) => {
  try {
    // Fetch the latest 20 withdrawal transactions
    const withdrawals = await Transaction.find({ type: "withdrawal" })
      .populate("user", "mobileNumber fullName")
      .populate("bankId", "bankName accountNumber ifscCode binanceAddress")
      .sort({ createdAt: -1 });

    console.log("The withdrawals data is", withdrawals);

    // Format the data for frontend or admin panel display
    const formattedData = withdrawals.map((txn, index) => {
      const user = txn.user || {};
      const bank = txn.bankId || {};

      return {
        sr: index + 1,
        mobileNumber: user.mobileNumber || "N/A",
        fullName: user.fullName || "N/A",

        method: txn.method,
        amount: txn.amount,

        status:
          txn.status === "completed"
            ? "Approved"
            : txn.status === "failed"
            ? "Rejected"
            : "Pending",

        requestDate: txn.createdAt.toISOString().split("T")[0],
        transactionId: txn.transactionId,
        transactionIdQr: txn.method === "usdt" ? txn.transactionIdQr : null,

        // Bank details (populated from BankDetail model)
        bankName: bank.bankName || "N/A",
        accountNumber: bank.accountNumber || "N/A",
        ifscCode: bank.ifscCode || "N/A",
        binanceAddress: bank.binanceAddress || "N/A",
        isAdminApproved: txn.isAdminApproved,
      };
    });

    // Send formatted withdrawal data as a response
    return res.status(200).json({
      success: true,
      message: "Withdrawal data fetched successfully",
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching withdrawal data:", error);

    // Send error response in case of failure
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getUserTransactionRequest = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findOne({ transactionId })
      .populate("user", "mobileNumber name")
      .populate(
        "bankId",
        "bankName accountNumber ifscCode transactionIdQr binanceAddress"
      );
    if (!transaction) {
      res.status(404).json({ message: "Transaction not found" });
    }
    console.log("The transaction is", transaction);

    return res.status(200).json({
      message: "Transaction request fetched",
      data: {
        transactionId: transaction.transactionId,
        transactionIdQr: transaction.transactionIdQr,

        user: transaction.user,
        amount: transaction.amount,
        method: transaction.method,
        status:
          transaction.status === "completed"
            ? "Approved"
            : transaction.status === "failed"
            ? "Rejected"
            : "Pending",
        requestDate: transaction.createdAt.toISOString().split("T")[0],
        bankDetails: {
          bankName: transaction.bankId?.bankName || "N/A",
          accountNumber: transaction.bankId?.accountNumber || "N/A",
          ifscCode: transaction.bankId?.ifscCode || "N/A",
          binanceAddress: transaction.bankId?.binanceAddress || "N/A",
          isAdminApproved: transaction.isAdminApproved,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user transactionRequest", error?.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

