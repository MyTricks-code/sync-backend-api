import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'
import sendEmail from "../helpers/sendEmail.js";

export const createUser = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ success: false, message: 'Request body is empty' })
        }

        const { email, name, password } = req.body

        if (!email || !name) {
            return res.status(400).json({ success: false, message: 'Missing name or email' })
        }

        // Enforce college domain for Microsoft logins

        // Only accept Microsoft-based signups here
        // if (!isMicrosoft) {
        //     return res.status(400).json({ success: false, message: 'This endpoint only supports Microsoft sign-ins' })
        // }

        // Find existing user or create a new one
        let user = await userModel.findOne({ email })

        if (user) {
            return res.json({
                success :false,
                message : "User already Exits"
            })
        }

        user = await userModel.create({
            name,
            email,
            // authProvider: 'microsoft',
            password,
    
        })
        await user.save()

        // Issue JWT cookie (7 days)
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'replace-me', { expiresIn: '7d' })

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return res.json({ success: true, message: 'User created successful;y'})
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error creating user: ' + err })
    }
}

export const loginUser = async (req, res) => {
    if (!req.body) {
        return res.json({
            success: false,
            message: "Request body is empty"
        })
    }

    const { email, password } = req.body

    if (!email || !password) {
        return res.json({
            success: false,
            message: "Missing credentials"
        })
    }

    try {
        // Find user by email
        const user = await userModel.findOne({ email: email })

        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            })
        }

        // Compare provided password with stored hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.json({
                success: false,
                message: "Invalid password"
            })
        }

        // Create JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })

        return res.json({
            success: true,
            message: "Login successful",
        })

    } catch (err) {
        return res.json({
            success: false,
            message: "Error during login: " + err
        })
    }
}

export const sendVerifyOtp = async (req, res)=>{
    try {
        const userId = req.userId
        console.log(userId)
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Missing user id'
            })
        }

        const user = await userModel.findById(userId)

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        if (user.isAccountVerified) {
            return res.json({
                success: false,
                message: 'User already verified'
            })
        }

        // Generate a 6-digit OTP between 100000 and 999999
        const otp = String(Math.floor(Math.random() * 900000) + 100000)

        // Store otp and expiry (10 minutes)
        user.verifyOtp = otp
        user.verifyOtpExpireAt = Date.now() + 10 * 60 * 1000 // 10 minutes
        await user.save()

        // Send otp email (await to catch failures)
        const mailOptions = {
            recipient: user.email,
            subject: 'Account Verification OTP',
            text: `Your OTP is ${otp}. It expires in 10 minutes.`
        }

        await sendEmail(mailOptions.recipient, mailOptions.subject, mailOptions.text)

        return res.json({
            success: true,
            message: 'OTP sent'
        })
    }catch (err){
        return res.json({
            success : false
        })
    }
}

export const logoutUser = async (req, res)=>{
    try{
        res.clearCookie('token', {
            httpOnly: true,
            secure : process.env.NODE_ENV === 'production',
            sameSite : process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        }) 
        return res.json({
            success: true,
            message: 'Logged Out'
        })
    }catch (err){
        return res.json({
            success: false,
            message: err.message
        })
    }
}

// export const microsoftLogin = async (req, res) => {
//     try {
//         const { idToken } = req.body

//         if (!idToken) {
//             return res.status(400).json({ success: false, message: 'Missing idToken' })
//         }

//         // Verify token with Microsoft JWKS
//         const payload = await verifyMicrosoftIdToken(idToken)

//         // Microsoft id_token may include email in several claims
//         const email = payload.email || payload.preferred_username || payload.upn
//         const name = payload.name || payload.given_name || 'Microsoft User'

//         if (!email) {
//             return res.status(400).json({ success: false, message: 'Token did not contain an email' })
//         }

//         if (!email.endsWith('@aitpune.edu.in')) {
//             return res.status(403).json({ success: false, message: 'Only aitpune.edu.in Microsoft accounts are allowed' })
//         }

//         // Find or create user
//         let user = await userModel.findOne({ email })
//         if (!user) {
//             user = await userModel.create({
//                 name,
//                 email,
//                 authProvider: 'microsoft',
//                 role: 'student'
//             })
//             await user.save()
//         }

//         const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'replace-me', { expiresIn: '7d' })

//         res.cookie('token', token, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === 'production',
//             sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
//             maxAge: 7 * 24 * 60 * 60 * 1000
//         })

//         return res.json({ success: true, message: 'Microsoft login successful', user: { id: user._id, email: user.email, name: user.name } })
//     } catch (err) {
//         console.error('microsoftLogin error:', err)
//         return res.status(500).json({ success: false, message: 'Microsoft login verification failed', error: err.message })
//     }
// }