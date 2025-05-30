const mongoose = require("mongoose");


const bankDetailSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  method: {
    type: String,
    enum: ['BANK', 'BINANCE'],
    required: true,
  },

  bankName: {
    type: String,
    trim: true,
    required: function () {
      return this.method === 'BANK';
    },
  },

  recipientName: {
    type: String,
    uppercase: true,
    trim: true,
    required: function () {
      return this.method === 'BANK';
    },
  },

  accountNumber: {
    type: String,
    unique: true,
    sparse: true, // needed because only BANK method uses this field
    validate: {
      validator: function (v) {
        // Only validate if method is BANK
        if (this.method !== 'BANK') return true;
        return /^\d{9,18}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid account number!`,
    },
    required: function () {
      return this.method === 'BANK';
    },
  },

  ifscCode: {
    type: String,
    uppercase: true,
    trim: true,
    validate: {
      validator: function (v) {
        if (this.method !== 'BANK') return true;
        return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid IFSC code!`,
    },
    required: function () {
      return this.method === 'BANK';
    },
  },

  email: {
    type: String,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (v) {
        if (this.method !== 'BANK') return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: (props) => `${props.value} is not a valid email!`,
    },
    required: function () {
      return this.method === 'BANK';
    },
  },

  binanceAddress: {
    type: String,
    trim: true,
    unique: true,
    sparse: true, // unique + sparse since it's optional for BANK method
    required: function () {
      return this.method === 'BINANCE';
    },
  },

}, { timestamps: true });

  
 


  


const BankDetail = mongoose.model("BankDetail", bankDetailSchema);

module.exports = BankDetail;
