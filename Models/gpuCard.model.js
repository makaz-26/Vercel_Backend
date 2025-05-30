const mongoose = require("mongoose");
const gpuPlans = require("../utils/gpuPlans");

const gpuCardSchema = new mongoose.Schema(
  {
    name: { 
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    baseRateMH: {
      type: Number, 
      required: true,
    },
    upgradeCost: {
      type: Number,
      required: true,
    },
    bonusMultiplier: {
      type: Number,
      default: 0,
    },
    coinPrice: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ["High", "Mid", "low", "Plan-Based"],
      required: true,
    },
     isUpgraded:{
      type:Boolean,
      default:false

     }
  },
  { timestamps: true }
);

// Total Mining Earnings of One Gpu Card
gpuCardSchema.methods.getEarnings = function () {

  const plan = gpuPlans.find((p) => p.planCost === this.price);

  if (!plan) {
    throw new Error("No matching plan found for this GPU card");
  }

  const baseEarnings = plan.baseEarning;
  const bonusEarnings = this.isUpgraded ? baseEarnings * this.bonusMultiplier : 0;
  const totalMining = baseEarnings + bonusEarnings;

  return {
    cardName: this.name,
    hashRateMH: plan.baseMH,
    hashRateGH: plan.baseGH,
    baseEarnings: baseEarnings.toFixed(2),
    bonusEarnings: bonusEarnings.toFixed(2),
    totalMining: totalMining.toFixed(2),
    upgradeCost: plan.upgradeCost,
    totalAfterUpgrade: `$${totalMining.toFixed(2)}/day`,
  };
};



const GpuModel = mongoose.model("GpuCard", gpuCardSchema);
module.exports = GpuModel;
