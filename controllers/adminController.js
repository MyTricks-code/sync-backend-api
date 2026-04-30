import jwt from 'jsonwebtoken'
import mongoose from 'mongoose';
import responseModel from '../models/responseModel.js';
import userModel from '../models/userModel.js';
import sendMail from "../helpers/resendEmail.js";

const connectOrg = async (club) => {
  const org = await mongoose.connection
    .collection("organization")
    .findOne({ name: club });

  return org;
};

export const adminLogin = async (req, res) => {
  try {

    if (!req.body) {
      return res.json({ success: false, message: "Body not provided" });
    }

    const { email, club } = req.body;

    if (!email || !club) {
      return res.json({ success: false, message: "Missing fields" });
    }

    const org = await connectOrg(club);

    if (!org) {
      return res.json({ success: false, message: "Organization not found" });
    }

    const admin = org.admins.find(
      (a) => a.email === email
    );

    if (!admin) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));


    await mongoose.connection.collection("organization").updateOne(
      { name: club, "admins.email": email },
      {
        $set: {
          "admins.$.loginOtp": otp,
          "admins.$.loginOtpExpireAt": Date.now() + 15 * 60 * 1000
        }
      }
    );

    // Send OTP
    const mailResult = await sendMail(email, "Admin Login OTP", `Your OTP is ${otp}. It expires in 15 minutes.`);

    if (mailResult && mailResult.success === false) {
      return res.json({
        success: false,
        message: mailResult.error || "Failed to send OTP email"
      });
    }

    return res.json({
      success: true,
      message: "OTP sent to email"
    });

    const token = jwt.sign({ email: admin.email, club: club }, process.env.JWT_SECRET || 'replace-me', { expiresIn: '7d' })
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return res.json({
      success: true,
      message: "Admin login successful"
    });

  } catch (err) {
    return res.json({
      success: false,
      message: err.message
    });
  }
};

export const verifyAdminOtp = async (req, res) => {
  try {
    const { email, club, otp } = req.body;

    if (!email || !club || !otp) {
      return res.json({ success: false, message: "Missing fields" });
    }

    const org = await connectOrg(club);

    if (!org) {
      return res.json({ success: false, message: "Organization not found" });
    }

    const admin = org.admins.find((a) => a.email === email);

    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }

    if (admin.loginOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    if (admin.loginOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP expired" });
    }

    // CLEAR OTP
    await mongoose.connection.collection("organization").updateOne(
      { name: club, "admins.email": email },
      {
        $set: {
          "admins.$.loginOtp": "",
          "admins.$.loginOtpExpireAt": 0
        }
      }
    );

    // CREATE TOKEN (7 DAYS)
    const token = jwt.sign(
      { email: admin.email, club: club },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      message: "Login successful"
    });

  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

export const adminLogout = async (req, res) => {
  try {
    res.clearCookie('adminToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    })
    return res.json({
      success: true,
      message: 'Logged Out'
    })
  } catch (err) {
    return res.json({ success: false, message: "error in logout: ", err })
  }
}

export const addMember = async (req, res) => {
  if (!req.body) {
    return res.json({ success: false, message: "Body not provided" });
  }

  const { club, memberId } = req.body;

  if (!club || !memberId) {
    return res.json({ success: false, message: "Missing credentials (club and email required)" })
  }

  try {
    const org = await connectOrg(club);

    // Find the user by their email
    const user = await userModel.findById(memberId)
    if (!user) {
      return res.json({ success: false, message: "User with this email not found" });
    }
    await userModel.updateOne(
      { _id: memberId },
      {
        $set: { role: "member" },
        $addToSet: { clubs: org._id }
      }
    );
    // Optional: Delete their form responses if necessary
    // possible bug
    // await responseModel.deleteMany({ form: form._id });

    // Add them to the organization's member array
    await mongoose.connection
      .collection("organization")
      .updateOne(
        { _id: org._id },
        { $addToSet: { members: user._id } }
      );

    return res.json({ success: true, message: "Member added to the club" });
  } catch (err) {
    return res.json({ success: false, message: "Error adding members to the club", err: err.message });
  }
}

export const deleteMember = async (req, res) => {
  if (!req.body) {
    return res.json({ success: false, message: "Body not provided" });
  }

  const { club, email, memberId } = req.body;

  if (!club || (!email && !memberId)) {
    return res.json({ success: false, message: "Missing credentials (email or memberId required)" })
  }

  try {
    const org = await connectOrg(club);

    let userIdToRemove = memberId;

    if (!userIdToRemove) {
      const user = await userModel.findOne({ email });
      if (!user) {
        return res.json({ success: false, message: "User with this email not found" });
      }
      userIdToRemove = user._id;
    }

    const result = await mongoose.connection.collection('organization').updateOne(
      { _id: org._id },
      { $pull: { members: new mongoose.Types.ObjectId(userIdToRemove) } }
    );

    if (result.modifiedCount === 0) {
      return res.json({ success: false, message: "User not present in members" });
    }

    await userModel.updateOne(
      { _id: userIdToRemove },
      {
        $set: { role: "applicant" },
        $pull: { clubs: org._id }
      }
    );

    return res.json({ success: true, message: "Successfully removed the member" });

  } catch (err) {
    return res.json({ success: false, message: "Error deleting member", err: err.message })
  }
}

export const getAllOrg = async (req, res) => {
  try {
    const data = await mongoose.connection.collection('organization').find({}, { projection: { name: 1 } }).toArray();
    if (!data) {
      return res.json({ success: false, message: "No data found: ", err })
    }

    return res.json({ success: true, message: "info found", data: data })
  } catch (err) {
    return res.json({ success: false, message: "Error getting info of all clubs: ", err })
  }
}

export const getAdminInfo = async (req, res) => {
  try {
    const { email, club } = req.body;
    if (!email || !club) {
      return res.json({ success: false, message: "Missing credentials" });
    }

    const org = await connectOrg(club);
    if (!org) {
      return res.json({ success: false, message: "Organization not found" });
    }

    const admin = org.admins.find(a => a.email === email);

    if (!admin) {
      return res.json({ success: false, message: "Admin not found in organization" });
    }

    return res.json({
      success: true,
      data: {
        name: admin.name || club + ' Admin',
        email: admin.email,
        role: 'Admin',
        avatar: org.logo || org.img,
        club: {
          id: org.abbr || club,
          name: org.name || club,
          abbr: org.abbr || club,
          logo: org.logo || org.img,
          role: 'Admin'
        }
      }
    });
  } catch (err) {
    return res.json({ success: false, message: "Error getting admin info: " + err.message });
  }
};

export const getAllMembers = async (req, res) => {
  if (!req.body) {
    return res.json({ success: false, message: "Missing credentials" });
  }
  const { club } = req.body;
  if (!club) {
    return res.json({ success: false, message: "Missing credentials" });
  }
  try {
    const org = await mongoose.connection.collection('organization').findOne({ name: club });
    if (!org) {
      return res.json({ success: false, message: "Organization not found" });
    }

    const memberIds = org.members || [];
    const populatedMembers = await userModel.find({ _id: { $in: memberIds } }).select('name role email').lean();

    return res.json({
      success: true,
      data: populatedMembers
    });
  } catch (err) {
    return res.json({
      success: false,
      message: "Error in fetching members",
      err: err.message
    });
  }
}

