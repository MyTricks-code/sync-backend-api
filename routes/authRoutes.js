import express from 'express'
import { createUser, loginUser, logoutUser, sendVerifyOtp} from '../controllers/userController.js'
import userAuth from '../middlewares/userAuth.js'

const authRouter = express.Router()

authRouter.post("/register", createUser)
authRouter.post('/login', loginUser)
authRouter.post('/logout', logoutUser)
authRouter.post("/verify-otp", userAuth, sendVerifyOtp);

export default authRouter