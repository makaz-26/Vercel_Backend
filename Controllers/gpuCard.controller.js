const mongoose = require("mongoose");

const GpuCard = require("../Models/gpuCard.model");
const User = require("../Models/user.model");
const gpuPlans = require("../utils/gpuPlans");



// Buy a GPU Card
exports.buyGpuCard = async (req, res) => {
  try {
    const { planCost } = req.body;
    const plan = gpuPlans.find((p) => p.planCost === planCost);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.balance < plan.planCost) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct cost and create a new GPU card based on the plan
    user.balance -= plan.planCost;
    const newGpuCard = await GpuCard.create({
      name: `GPU-${plan.planCost}`,
      price: plan.planCost,
      baseRateMH: plan.baseMH,
      upgradeCost: plan.upgradeCost,
      bonusMultiplier: plan.bonusPerDay,
      coinPrice: plan.baseEarning,
      category: "Plan-Based",
    });

    // Add the new GPU card's ID to the user's owned GPUs
    user.ownedGpus.push(newGpuCard._id);
    await user.save();

    // Calculate daily earnings for the new GPU card
    const earnings = newGpuCard.getEarnings(false);

    res.status(200).json({
      message: "GPU card purchased successfully",
      gpuCard: newGpuCard,
      earnings,
    });
  } catch (error) {
    console.error("Error buying GPU card:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Upgrade a GPU Card
exports.upgradeGpuCard = async (req, res) => {
  try {
    const { gpuCardId } = req.body;
    if (!gpuCardId) return res.status(400).json({ message: "gpuCardId is required" });


    //Validate User
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check ownership
    if (!user.ownedGpus.includes(gpuCardId)) {
      return res.status(403).json({ message: "You do not own this GPU card" });
    }

    const gpuCard = await GpuCard.findById(gpuCardId);
    if (!gpuCard) return res.status(404).json({ message: "GPU card not found" });

    if (gpuCard.isUpgraded) {
      return res.status(400).json({ message: "GPU card already upgraded" });
    }

    if (user.balance < gpuCard.upgradeCost) {
      return res.status(400).json({ message: "Insufficient balance to upgrade" });
    }

    user.balance -= gpuCard.upgradeCost;
    await user.save();


    //Find the plan based on the Gpu Card's price
    const plan=gpuPlans.find((p)=>(p.planCost===gpuCard.price));

    if (!plan) return res.status(404).json({ message: "Plan not found" });

    // Calculate the upgraded hash rate based on the plan
    gpuCard.baseRateMH = plan.baseMH * 1.5;
    gpuCard.isUpgraded = true;
    await gpuCard.save();

    res.status(200).json({
      message: "GPU card upgraded successfully",
      upgradedGpuCard: gpuCard,
      userBalance: user.balance,
      earnings: gpuCard.getEarnings(),
    });
  } catch (error) {
    console.error("Error upgrading GPU card:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//Get all Gpu Cards of a specific User
exports.getAllGpuUser=async(req,res)=>{
  try{
    const user=await User.findById(req.user.id);
     if(!user)return res.status(404).json({message:"User not found"});
    const gpuCards=await user.populate("ownedGpus","name price baseRateMH upgradeCost isUpgraded");
    if (!gpuCards)return res.status(404).json({message:"No Gpu Cards found"});
      res.status(200).json({
        message:"Gpu cards fetched Successfully",
        data:gpuCards.ownedGpus.map((card)=>{
          return {
            id:card._id,
            name:card.name,
            price:card.price,
            baseRateMH:card.baseRateMH,
            upgradeCost:card.upgradeCost,
            isUpgraded:card.isUpgraded,

          }

        })

      })
  }catch(error){
    res.status(500).json({message:"Internal Server Error"})
  }

}




