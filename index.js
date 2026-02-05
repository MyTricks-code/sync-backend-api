import express from 'express'
import 'dotenv/config'
import cookieParser from 'cookie-parser';
import connectDB from './config/mongoDB.js';
import authRouter from './routes/authRoutes.js';

// config
const PORT = 8000 || process.env.PORT
const app = express()
connectDB()

// Middlewares
app.use(express.json());
app.use(cookieParser())

app.get("/", (req, res)=>{
    res.send("SYNC AIT BACKEND API")
})

// Routes
app.use("/api/auth", authRouter)

app.listen(PORT, ()=>{
    console.log("Server Started: ", PORT)
})