const express = require("express");
const router = express.Router();
const { runMiningCron } = require("../cron/dailyMining.cron"); 

router.get("/run-daily-mining", async (req, res) => {
  try {
    await runMiningCron();
    res.status(200).json({ success: true, message: "Daily mining job run manually." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Mining job failed." });
  }
});

module.exports = router;
