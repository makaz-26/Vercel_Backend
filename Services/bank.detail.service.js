// /services/bankDetailService.js

const BankDetail=require('../Models/bankdetails.model');
const User=require('../Models/user.model');

module.exports.addBankDetail = async (bankName, recipientName, accountNumber, email, ifscCode, userId) => {
  try {
    // Verify all required fields are present
    if (!userId || !bankName || !recipientName || !accountNumber || !email || !ifscCode) {
      throw new Error('All fields are required');
    }

    

    const newBankDetail = new BankDetail({
      user: userId,
      bankName,
      recipientName,
      accountNumber,
      email,
      ifscCode,
    });

    // Save the bank details
    const savedBankDetail = await newBankDetail.save();
    return savedBankDetail;
  } catch (err) {
    console.log("Error in adding bank details service:", err);
    throw err; // Re-throw the error to be handled by the controller
  }
};
