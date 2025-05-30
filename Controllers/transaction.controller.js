const transactionService = require("../Services/transaction.service");
const Transaction = require("../Models/transaction.model");
const User = require("../Models/user.model");

//   try {
//     const { amount, method, accountDetails } = req.body;
//     const user = req.user;
//     console.log("The user is",user);

//     // Create deposit transaction
//     const newTransaction = await transactionService.addDepositService(
//       user,
//       amount,
//       method,
//       accountDetails
//     );

//     //Referral logic on first deposit
//     if(user.referredBy  && !user.hasDeposited){
//       //3.Build Referral tree
//       await User.buildReferralTreeForNewUser(user);

//       //4 Distribute referral ernings
//       await User.distributeToUplines(user.referralCode,amount);

//       //5-> Mark as deposited
//       user.hasDeposited=true;
//       await user.save();

//     }

//     return res.status(201).json({
//       message: "Deposit transaction created",
//       transaction: newTransaction,
//     });
//   } catch (err) {
//     console.error(err);
//     return res
//       .status(500)
//       .json({ message: "Server error", error: err.message });
//   }
// };

//User Deposit with a Upi or Usdt Method
module.exports.addDeposit = async (req, res) => {
  try {
    const { amount, method, transactionIdQr,type="deposit" } = req.body;
    const user = req.user;
    console.log("The user is", user);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const transactionIdQrCheck = await Transaction.findOne({ transactionIdQr });
    if (transactionIdQrCheck) {
      return res
        .status(400)
        .json({ message: "TransactionIdQr already exists" });
    }

    if (!amount || !method || !transactionIdQr) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newTransaction = await transactionService.addDepositService(
      user,

      amount,
      method,

      transactionIdQr, // Use the transaction ID provided by GPay or usdt
      type
    );

    return res.status(201).json({
      message: "Deposit transaction created",
      transaction: newTransaction,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

//Get all deposit transaction with a userId
module.exports.getAllDepositTransaction=async(req,res)=>{
  try{
    const userId = req.user.id;
    const transactions=await Transaction.find({user:userId,type:"deposit"});
    if(!transactions || transactions.length===0){
      return res.status(404).json({message:"No deposit transactions found"});
    }
    return res.status(200).json({
      message:"Deposit transactions fetched successfully",
      transactions:transactions
    })

  }catch(err){
    console.log("Error fetching deposit transactions", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


//get deposit transaction with a transactionId

module.exports.getDepositTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const user = req.user;
    if (!user) {
      return res.status(404).json(`The user is not found`);
    }

    const userDeposit = await Transaction.find({ transactionId }).populate(
      "user"
    );
  } catch (error) {
    console.log("The error is", error?.message);
    res.status(500).josn(`The internal server error is`, error.message);
  }
};

module.exports.addWithdrawal = async (req, res) => {
  try {
    const { amount, method, bankId, password } = req.body;

    const user = req.user;
    if (!user) {
      return res.status(400).json({ message: "User is not  authenticated" });
    }

    const dbUser = await User.findById(user.id);

    if (!dbUser) {
      return res.status(400).json({ message: "User not found in DB" });
    }

    if (!amount || !method || !password || !bankId) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // Validate balance
    if (amount < 0 || dbUser.balance < 0 || amount > dbUser.balance) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    if (!dbUser.password) {
      return res.status(400).json({ message: "Password is not set for user" });
    }

    const isMatch = await dbUser.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: "Password is incorrect" });
    }

    const newTransaction = await transactionService.addWithdrawalService(
      dbUser,
      amount,
      method,
      bankId,

      password
    );

    return res.status(201).json({
      message: "Withdrawal transaction created",
      transaction: newTransaction,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

module.exports.getAllWithdrawTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      res.status(400).json({ message: "User Id misssing from request" });
    }

    const transactions = await Transaction.find({user:userId,type:"withdrawal"});

    if (!transactions) {
      return res
        .status(404)
        .json({ message: "No withdraw transactions found" });
    }
    res.status(200).json({
      message: "Withdraw transactions fetched successfully",
      transactions: transactions,
    });
  } catch (err) {
    console.log("Error fetching withdraw transactions", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
