import upload from '../middlewares/upload.js'
import express from 'express'
import { checkMember, createUser, getUserInfo, loginUser, logoutUser, sendForgetPasswordOtp, sendVerifyOtp, updateUserInfo, verifyAccount, verifyForgotPasswordOtp} from '../controllers/userController.js'
import userAuth from '../middlewares/userAuth.js'
import { googleAuth } from '../controllers/googleAuth.js'

const authRouter = express.Router()

authRouter.post("/register", createUser)
authRouter.post('/login', loginUser)
authRouter.post('/logout', logoutUser)
authRouter.post("/verify-otp", userAuth, sendVerifyOtp);
authRouter.post('/verify-account', userAuth, verifyAccount)
authRouter.post('/forget-password', sendForgetPasswordOtp)
authRouter.post('/verify-forget-otp', verifyForgotPasswordOtp)
authRouter.post('/update-user-info', userAuth, upload.single("avatar"),updateUserInfo)
authRouter.post('/google-auth', googleAuth)
authRouter.get("/get-user-info", userAuth, getUserInfo)
authRouter.post("/verify-membership", userAuth, checkMember)

export default authRouter