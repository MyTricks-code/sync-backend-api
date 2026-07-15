import upload from '../middlewares/upload.js'
import express from 'express'
// [EMAIL/PASSWORD AUTH — INTENTIONALLY DISABLED]
// Applicants must sign in via Google. The imports below reflect only the
// active controllers. To re-enable, restore the full import line:
//   import { checkMember, createUser, getUserInfo, loginUser, logoutUser,
//            sendForgetPasswordOtp, sendVerifyOtp, updateUserInfo,
//            verifyAccount, verifyForgotPasswordOtp }
//     from '../controllers/userController.js'
import { checkMember, getUserInfo, logoutUser, updateUserInfo } from '../controllers/userController.js'
import userAuth from '../middlewares/userAuth.js'
import { googleAuth } from '../controllers/googleAuth.js'

const authRouter = express.Router()

// ── [EMAIL/PASSWORD AUTH — INTENTIONALLY DISABLED] ──────────────────────────
// These routes handled applicant registration and login via email + password.
// They are commented out so the code is preserved and can be re-enabled.
// Only Google OAuth is active for applicants.
//
// authRouter.post("/register", createUser)
// authRouter.post('/login', loginUser)
// authRouter.post("/verify-otp", userAuth, sendVerifyOtp)
// authRouter.post('/verify-account', userAuth, verifyAccount)
// authRouter.post('/forget-password', sendForgetPasswordOtp)
// authRouter.post('/verify-forget-otp', verifyForgotPasswordOtp)
// ────────────────────────────────────────────────────────────────────────────

authRouter.post('/logout', logoutUser)
authRouter.post('/update-user-info', userAuth, upload.single("avatar"), updateUserInfo)
authRouter.post('/google-auth', googleAuth)
authRouter.get("/get-user-info", userAuth, getUserInfo)
authRouter.post("/verify-membership", userAuth, checkMember)

export default authRouter
