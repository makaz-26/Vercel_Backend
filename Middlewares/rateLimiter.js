const rateLimit = require("express-rate-limit");

exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, //15 minutes
  max: 10, //Limit each Ip to 10 request per windows
  message:
    "Too many Login attempts from this IP,Please try again after 15 minutes",
});

exports.generalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, //1 hour
  max: 1000,
  message: "Too many request from this IP,Please try again after an hour",
});
