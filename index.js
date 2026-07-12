import express from 'express'
import 'dotenv/config'
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import connectDB from './config/mongoDB.js';
import authRouter from './routes/authRoutes.js';
import taskRouter from './routes/taskRoutes.js';
import cors from 'cors'
import formRouter from './routes/formRoutes.js';
import responseRouter from './routes/responseRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import eventsRouter from "./routes/eventRoutes.js";
import postRouter from './routes/postRoutes.js';
import superAdminRouter from './routes/superAdminRoutes.js';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const PORT = process.env.PORT || 8000;
const app = express();
app.set('trust proxy', 1); // trust nginx reverse proxy so rate limiters use real client IPs
connectDB();

// Security headers (helmet must come before CORS)
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Compress all responses — saves ~60-80% bandwidth on JSON
app.use(compression());

// CORS
const ORIGIN = process.env.ORIGIN || 'http://localhost:5173';
console.log("CORS Origin set to:", ORIGIN);
app.use(cors({
  origin: [ORIGIN, 'http://localhost:5173'],
  credentials: true,
}));

// Body parsing with hard size limits — prevents memory exhaustion
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

if (!process.env.MONGO_URI) {
  console.error('ERROR: MONGO_URI environment variable is missing.');
  process.exit(1);
}

// General rate limit: 100 req / 15 min per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

// Tighter limit for auth — prevents brute-force and OTP bombing.
// Skips get-user-info because checkAuth is called on every page load and would
// otherwise burn through the bucket, blocking legitimate logins.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.originalUrl.startsWith('/api/auth/get-user-info'),
  message: { success: false, message: 'Too many attempts, please try again in 15 minutes.' }
});

app.use(limiter);

app.get("/", (req, res) => {
  res.send("SYNC AIT BACKEND API");
});

// Routes
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/task", taskRouter);
app.use('/api/forms', formRouter);
app.use('/api/response', responseRouter);
app.use('/api/admin', adminRouter);
app.use("/api/post", postRouter);
app.use("/api/events", eventsRouter);
app.use("/api/superadmin", superAdminRouter);

// Graceful shutdown so the process doesn't hang on SIGTERM from the droplet
process.on('SIGTERM', () => {
  console.log('[App] SIGTERM received — shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log("Server Started: ", PORT);
});
