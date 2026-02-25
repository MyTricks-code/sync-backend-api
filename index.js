import express from 'express'
import 'dotenv/config'
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import connectDB from './config/mongoDB.js';
import authRouter from './routes/authRoutes.js';
import taskRouter from './routes/taskRoutes.js';
import cors from 'cors'
// config
// config
const PORT = process.env.PORT || 8000
const app = express()
connectDB()

// Middlewares
app.use(express.json());
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.ORIGIN || 'http://localhost:5173', // react frontend
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

app.listen(PORT, () => {
  console.log("Server Started: ", PORT)
})