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

const PORT = process.env.PORT || 8000
const app = express()
connectDB()



// Middlewares
const ORIGIN = process.env.ORIGIN || 'http://localhost:5173'
console.log("CORS Origin set to:", ORIGIN)
app.use(express.json());
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [ORIGIN, 'http://localhost:5173'],
    credentials: true,
  })
);


if (!process.env.MONGO_URI) {
  console.error('ERROR: MONGO_URI environment variable is missing.');
  process.exit(1);
}

app.get("/", (req, res) => {
  res.send("SYNC AIT BACKEND API")
})

// Routes
app.use("/api/auth", authRouter)
app.use("/api/task", taskRouter)
app.use('/api/forms', formRouter)
app.use('/api/response', responseRouter)
app.use('/api/admin', adminRouter);
app.use("/api/post", postRouter);
app.use("/api/events", eventsRouter);

  
app.listen(PORT, () => {
  console.log("Server Started: ", PORT)
})