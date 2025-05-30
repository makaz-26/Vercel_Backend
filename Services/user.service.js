const User = require("../Models/user.model");
module.exports.createUser = async ({ mobileNumber, password, referredBy }) => {
  if (!mobileNumber || !password) {
    throw new Error("Mobile number and password are required");
  }

  const user = await User.create({
    mobileNumber,
    password,
    referredBy,
  });

  return user;
};
