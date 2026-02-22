import express from 'express'
import { createUser, getUserInfo, loginUser, logoutUser, sendVerifyOtp, verifyAccount} from '../controllers/userController.js'
import userAuth from '../middlewares/userAuth.js'

const authRouter = express.Router()

authRouter.post("/register", createUser)
authRouter.post('/login', loginUser)
authRouter.post('/logout', logoutUser)
authRouter.post("/verify-otp", userAuth, sendVerifyOtp);
authRouter.post('/verify-account', userAuth, verifyAccount)
authRouter.get("/get-user-info", userAuth, getUserInfo)

export default authRouter