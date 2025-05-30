const cron = require("node-cron");
const User = require("../Models/user.model");
const GpuCard = require("../Models/gpuCard.model");

const runMiningCron = async () => {
  console.log("Manual mining cron triggered...");
  try {
    const users = await User.find({
      isActive: true,
      ownedGpus: { $exists: true, $not: { $size: 0 } },
    });

    console.log(`Number of active users with GPUs: ${users.length}`);
    if (users.length === 0) return;

    for (const user of users) {
      let totalEarnings = 0;
      let totalMiningRate = 0;

      await user.populate("ownedGpus");

      for (const gpuCard of user.ownedGpus) {
        try {
          const earnings = gpuCard.getEarnings();
          totalEarnings += parseFloat(earnings.totalMining);
          totalMiningRate += parseFloat(earnings.hashRateMH);
        } catch (gpuError) {
          console.error(`GPU error for ${gpuCard._id}:`, gpuError);
        }
      }

      user.totalMiningEarning += totalEarnings;
      user.miningRate = totalMiningRate;
      user.balance += totalEarnings;

      try {
        await user.save();
        console.log(`Updated user ${user.mobileNumber}: $${totalEarnings}`);
      } catch (saveError) {
        console.error(`Save error for user ${user._id}:`, saveError);
      }
    }

    console.log("Mining cron job completed.");
  } catch (error) {
    console.error("Cron failed:", error);
  }
};


const dailyMiningCron = () => {
  cron.schedule("0 0 * * *", runMiningCron);
};

module.exports = { runMiningCron, dailyMiningCron };
