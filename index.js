import express from 'express'
import 'dotenv/config'
import connectDB from './config/mongoDB.js';

// config
const PORT = 8000 || process.env.PORT
const app = express()
connectDB()

// Middlewares
app.use(express.json());

app.get("/", (req, res)=>{
    res.send("SYNC AIT BACKEND API")
})

app.listen(PORT, ()=>{
    console.log("Server Started: ", PORT)
})