import { OAuth2Client } from "google-auth-library";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "No token provided" });
    }
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub } = payload;

    // Find existing userModel
    let user = await userModel.findOne({ email });

    if (!user) {
        user = await userModel.create({
        email,
        name,
        googleId: sub,
        authProvider: "google",
        isEmailVerified: true,
      });
    }

    // Generate your own app JWT
    const appToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'replace-me',
      { expiresIn: "7d" }
    );

    res.cookie('token', appToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return res.json({ success: true, token: appToken });

  } catch (error) {
    console.log(error)
    return res.status(401).json({ success: false, message: "Invalid Google token: " });
  }
};