const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const connectDB = require("./db/db");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { generalLimiter } = require("./Middlewares/rateLimiter");
const userRoutes = require("./routes/user.routes");
const otpRoutes = require("./routes/otp.routes");
const transactionRoutes = require("./routes/transaction.routes");
const bankRoutes = require("./routes/bank.detail.routes");
const referralRoutes = require("./routes/referral.routes");
const gpuCardRoutes = require("./routes/gpuCard.routes");
const adminRoutes = require("./routes/admin.routes");
const gpuPlanRoutes = require("./routes/gpuPlan.routes");
const cronRoutes=require('./routes/cron.routes')


const PORT = process.env.PORT || 5000;



// Set up all the middleware
app.use(express.json());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://0180-122-161-49-62.ngrok-free.app', // <- Add your ngrok frontend URL here
  'https://vercel-frontend-six-vert.vercel.app',
 
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));



app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Trust proxy (needed for secure cookies behind a proxy/load balancer)
app.set('trust proxy', 1);

//Connect to the database
connectDB();

// Debugging middleware to log incoming requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  console.log("Request body:", req.body); // Log the request body for debugging
  next();
});

// Apply general rate limiter
app.use(generalLimiter);

//Set Up all the routes
app.use("/users", userRoutes);
app.use("/referral", referralRoutes);
app.use("/otp", otpRoutes);
app.use("/transactions", transactionRoutes);
app.use("/bank", bankRoutes);
app.use("/gpuCard", gpuCardRoutes);
app.use('/gpuPlan',gpuPlanRoutes)
app.use("/admin", adminRoutes);
app.use("/api/cron", cronRoutes);



// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the full error stack for debugging

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message: message,
    // Optionally, you can include the stack trace in development
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

app.get("/", (req, res) => {
  res.send(`Hello from the server`);
});

app.listen(PORT, () => {
  console.log(`server is running on the ${PORT}`);
});
