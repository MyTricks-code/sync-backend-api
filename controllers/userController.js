import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'
import sendMail from "../helpers/resendEmail.js";

export const createUser = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ success: false, message: 'Request body is empty' })
        }

        const { email, name, password, year } = req.body

        if (!email || !name || !password || !year) {
            return res.status(400).json({ success: false, message: 'Missing name or email' })
        }

        if(password.length>20){
            return res.status(400).json({ success: false, message: 'Too long Password' })
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
                success: false,
                message: "User already Exits"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user = await userModel.create({
            name,
            email,
            // authProvider: 'microsoft',
            password: hashedPassword,
            year: year

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

        return res.json({ success: true, message: 'User created successful;y' })
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

export const sendVerifyOtp = async (req, res) => {
    try {
        const userId = req.userId
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
            content: `Your OTP is ${otp}. It expires in 10 minutes.`
        }

        const emailSent = await sendMail(mailOptions.recipient, mailOptions.subject, mailOptions.content)

        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send OTP email'
            })
        }

        return res.json({
            success: true,
            message: 'OTP sent'
        })
    } catch (err) {
        return res.json({
            success: false
        })
    }
}

export const verifyAccount = async(req, res)=>{
    if(!req.body){
        return res.json({success: false, message: "Missing Credentials"})
    }
    

    try{
        const userId = req.userId
        const {otp} = req.body
        if (!userId || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Missing credentials'
            })
        }
        const user = await userModel.findById(userId)
        if(otp===user.verifyOtp){
            user.isAccountVerified = true,
            user.verifyOtp = "";
            user.verifyOtpExpireAt =0;
            await user.save()
            return res.json({success: true, message: "Account successfully verified"})
        }else{
            return res.json({success: false, message: "OTP miss-matched"})
        }

    }catch(err){
        return res.json({success: false, message: "Err verifying account: "})
    }
}

export const getUserInfo = async(req, res)=>{
    try{
        const userId = req.userId
        if(!userId) return res.json({success: false, message: "Forbidden"})
        const user = await userModel.findById(userId);
        return res.json({
            success: true,
            data : {
                name : user.name,
                email: user.email,
                role: user.role,
                clubs:  user.clubs,
                year : user.year,
                bio : user.bio,
                callSign : user.callSign
            }
        })
    }catch(err){
        return res.json({success: false, message: "Error reading user data"})
    }
}

export const sendForgetPasswordOtp = async (req, res)=>{
    if(!req.body){
        return res.json({ success: false, message: 'Missing request body' })
    }
    const {email} = req.body
    if(!email){
        return res.json({success: false, message : "Missing Credentials"})
    }
    try{
        const user = await userModel.findOne({email : email})
        if(!user){
            return res.json({success: false, message : "Invalid Email"})
        }

        const otp = String(Math.floor(Math.random() * 900000) + 100000)
        user.resetOtp  = otp
        user.resetOtpExpireAt = Date.now() + 10 * 60 * 1000 // 10 minutes
        await user.save()

        const mailOptions = {
            recipient: email,
            subject: 'Reset your Password',
            content: `Your OTP is ${otp}. It expires in 10 minutes.`
        }

        const emailSent = await sendMail(mailOptions.recipient, mailOptions.subject, mailOptions.content)

        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send OTP email'
            })
        }

        return res.json({
            success: true,
            message: 'OTP sent'
        })
    }catch(err){
        return res.json({success: false, message: "Error sending forget password otp: ", err})
    }
}

export const verifyForgotPasswordOtp = async (req, res)=>{
    if(!req.body){
        return res.json({success: false, message: "Empty request body"})
    }
    const {otp, email, password} = req.body
    if(!otp || !email || !password){
        res.json({success: false, message: "Missing Credentials"})
    }
    try{
        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success: false, message: "Missing User"})
        }
        if(user.resetOtpExpireAt<Date.now()){
            return res.json({success: false, message: "OTP Expired"})
        }

        if(user.resetOtp!==otp){
            return res.json({success: false, message: "Invalid OTP"})
        }

        if(password.length>20){
            return res.status(400).json({ success: false, message: 'Too long Password' })
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        user.password = hashedPassword
        user.resetOtp = ''
        user.resetOtpExpireAt = 0;
        await user.save()

        return res.json({success: true, message: "Successfully updated Password"})
        
    }catch(err){
        return res.json({ success: false, message: 'Error Verifying Forget Pass Otp: ', err})
    }
}

export const logoutUser = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        return res.json({
            success: true,
            message: 'Logged Out'
        })
    } catch (err) {
        return res.json({
            success: false,
            message: err.message
        })
    }
}

/** This is a function to be used for microsoft login- Cant be used because of card issues with Azure 
export const microsoftLogin = async (req, res) => {
    try {
        const { idToken } = req.body

        if (!idToken) {
            return res.status(400).json({ success: false, message: 'Missing idToken' })
        }

        // Verify token with Microsoft JWKS
        const payload = await verifyMicrosoftIdToken(idToken)

        // Microsoft id_token may include email in several claims
        const email = payload.email || payload.preferred_username || payload.upn
        const name = payload.name || payload.given_name || 'Microsoft User'

        if (!email) {
            return res.status(400).json({ success: false, message: 'Token did not contain an email' })
        }

        if (!email.endsWith('@aitpune.edu.in')) {
            return res.status(403).json({ success: false, message: 'Only aitpune.edu.in Microsoft accounts are allowed' })
        }

        // Find or create user
        let user = await userModel.findOne({ email })
        if (!user) {
            user = await userModel.create({
                name,
                email,
                authProvider: 'microsoft',
                role: 'student'
            })
            await user.save()
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'replace-me', { expiresIn: '7d' })

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return res.json({ success: true, message: 'Microsoft login successful', user: { id: user._id, email: user.email, name: user.name } })
    } catch (err) {
        console.error('microsoftLogin error:', err)
        return res.status(500).json({ success: false, message: 'Microsoft login verification failed', error: err.message })
    }
}
*/