import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'
import sendEmail from "../helpers/sendEmail.js";

export const createUser = async (req, res) => {
    if (!req.body) {
        return res.json({
            success: false,
            message: "Request body is empty"
        })
    }

    const { name, email, password } = req.body
    if (!name || !email || !password) {
        return res.json({
            success: false,
            message: "Missing credentials"
        })
    }

    if (!email.endsWith("aitpune.edu.in")) {
        return res.json({
            success: false,
            message: "Only College Email is supported"
        })
    }

    if (password.length >= 15) {
        return res.json({
            success: false,
            message: "Too Long Password"
        })
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(
            password, salt
        )
        const user = await userModel.create({
            name: name,
            email: email,
            password: hashedPassword,
        })
        await user.save()

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'})
        res.cookie('token', token, {
            httpOnly: true,
            secure : process.env.NODE_ENV === 'production',
            // strict : cookies is only send when the request comes form samesite
            sameSite : process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7*24*60*60*1000 //7days
        })

        const mailOptions = {
            recipient  : email,
            subject : "Welcome to SYNC - Collaborate and Grow!",
            text  :  `Hello there a new account is created with : ${user.email}`
        }
        sendEmail(mailOptions.recipient, mailOptions.subject, mailOptions.text)

        return res.json({
            success: true,
            message: "User created successfully"
        })
        
    } catch (err) {
        return res.json({
            success: false,
            message: "Error creating user: " + err
        })
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
        const user = await userModel.findById(userId)
        if(user.isAccountVerified){
            return res.json({
                success : false,
                message : "User already verified"
            })
        }
        const otp  = String(Math.floor(Math.random()*100000)+100000);
        user.verifyOtp = otp
        user.verifyOtpExpireAt = Date.now()  + 24*60*60*1000
        await user.save()
        
        // Send otp email
        const mailOptions = {
            recipient  : user.email,
            subject : "Account Verification OTP",
            text  :  `Your OTP is ${otp}. Verify your otp using this otp`
        }
        sendEmail(mailOptions.recipient, mailOptions.subject, mailOptions.text)
        return res.json({
            success : true,
            message : "OTP send"
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