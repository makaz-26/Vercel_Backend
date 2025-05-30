const BankDetail = require("../Models/bankdetails.model");
const Transaction = require("../models/transaction.model");
const User = require("../models/user.model");

// Service to create a deposit transaction

module.exports.addDepositService = async (
  user,

  amount,
  method,
  transactionIdQr,
  type
) => {
  const depositAmount = Number(amount);
  if (isNaN(depositAmount) || depositAmount <= 0) {
    throw new Error("Invalid deposit amount");
  }

  // Ensure user balance is defined
  const balanceBefore = Number(user.balance) || 0;
  const balanceAfter = balanceBefore + depositAmount;

  const transactionData = {
    user: user.id,
    type: "deposit",
    amount: depositAmount,
    method,

    status: "pending",
    orderNumber: generateOrderNumber(),
    transactionId: generateTransactionId(),
    transactionIdQr: transactionIdQr,
    balanceBefore: user.balance,
    balanceAfter: user.balance,
  };

  const newTransaction = await Transaction.createTransaction(transactionData);

  return newTransaction;
};

// Service to create a withdrawal transaction
module.exports.addWithdrawalService = async (user, amount, method, bankId) => {
  if (amount > user.balance) {
    throw new Error("Insufficient funds");
  }

  const transactionData = {
    user: user.id,
    type: "withdrawal",
    amount,
    method,
    bankId: bankId,

    status: "pending", // waiting for admin
    isAdminApproved: false,
    transactionId: generateTransactionId(),
    orderNumber: generateOrderNumber(),
    balanceBefore: user.balance,
    balanceAfter: user.balance, // no deduction yet
  };

  const newTransaction = await Transaction.createTransaction(transactionData);
  return newTransaction;
};

//function to generate a unique order number
function generateOrderNumber() {
  return "ORD" + Date.now();
}

//function to generate a unique transactionId
const generateTransactionId = () => {
  return "TXN" + Math.random().toString(36).substr(2, 9);
};
