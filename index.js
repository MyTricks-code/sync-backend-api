import express from 'express'
import 'dotenv/config'
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';

import connectDB from './config/mongoDB.js';
import authRouter from './routes/authRoutes.js';

// config
// config
const PORT = process.env.PORT || 8000
const app = express()
connectDB()

// Middlewares
app.use(express.json());
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-env',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongoUrl: process.env.MONGO_URI
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Set to true only in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// app.use(passport.initialize());
// app.use(passport.session());

app.get("/", (req, res) => {
  res.send("SYNC AIT BACKEND API")
})

// Routes
app.use("/api/auth", authRouter)

app.listen(PORT, () => {
  console.log("Server Started: ", PORT)
})