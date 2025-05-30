const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt=require("jsonwebtoken");

const adminSchema = new mongoose.Schema(
  {
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: "Invalid mobile number",
      },
    },
    password: {
      type: String,
      required: true,
      select:false,
      validate: {
        validator: function (v) {
          return v.length >= 6 && v.length <= 20;
        },
        message: "Password must be between 6 and 20 characters",
      },
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } 
);

// Pre-save hook to hash password
adminSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Methods

adminSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

adminSchema.methods.updatePassword = async function (oldPassword, newPassword) {
  try {
    const isMatch = await this.comparePassword(oldPassword);
    if (!isMatch) {
      throw new Error("Old password is incorrect");
    }
    this.password = newPassword; // Pre-save hook will hash it
    await this.save();
    return true;
  } catch (error) {
    throw new Error(error.message);
  }
};

adminSchema.methods.setOnline = function () {
  this.isOnline = true;
  return this.save;
};

adminSchema.methods.setOffline = function () {
  this.isOnline = false;
  return this.save();
};


//generate access token for admin
adminSchema.methods.generateAccessToken=function(){
    const accessToken=jwt.sign({id:this._id,role:'admin'},process.env.JWT_SECRET,{expiresIn:'15m'});
    return accessToken;
}
//Generate refresh token for admin
adminSchema.methods.generateRefreshToken=function(){
    const refreshToken=jwt.sign({id:this._id,role:'admin'},process.env.JWT_REFRESH_SECRET,{expiresIn:'30d'});
    return refreshToken;
}



const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
