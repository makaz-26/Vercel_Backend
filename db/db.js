const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL)
    console.log("MONGODB is connected");
    

  } catch (error) {
    console.log("The error is", error);
  }
};

module.exports = connectDB;
