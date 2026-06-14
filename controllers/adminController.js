import jwt from 'jsonwebtoken'
import mongoose from 'mongoose';
import responseModel from '../models/responseModel.js';
import userModel from '../models/userModel.js';
import sendMail from "../helpers/resendEmail.js";
import SuperAdmin from "../models/superAdminModel.js";

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

    if (!email) {
      return res.json({ success: false, message: "Email required" });
    }

    const superAdmin =
      await SuperAdmin.findOne({
        email
      });

    if (superAdmin) {

      const otp = String(
        Math.floor(
          100000 +
          Math.random() * 900000
        )
      );

      superAdmin.loginOtp = otp;

      superAdmin.loginOtpExpireAt =
        Date.now() + 15 * 60 * 1000;

      await superAdmin.save();

      const mailResult =
        await sendMail(
          email,
          "Admin Login OTP",
          `Your OTP is ${otp}. It expires in 15 minutes.`
        );

      if (mailResult?.success === false) {

        return res.json({
          success: false,
          message:
            mailResult.error
        });

      }

      return res.json({
        success: true,
        role: superAdmin.role,
        isSuperAdmin: true,
        message: "OTP sent"
      });

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


    const updateResult =
      await mongoose.connection
        .collection("organization")
        .updateOne(
          {
            name: club,
            "admins.email": email
          },
          {
            $set: {
              "admins.$.loginOtp": otp,
              "admins.$.loginOtpExpireAt":
                Number(
                  Date.now() + 15 * 60 * 1000
                )
            }
          }
        );

    console.log(
      "OTP UPDATE RESULT:",
      updateResult
    );

    // Send OTP
    console.log(
      "OTP GENERATED:",
      otp
    );

    console.log(
      "EMAIL:",
      email
    );
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

    const token = jwt.sign({ email: admin.email, club: club, role: admin.role, adminId: admin.userId }, process.env.JWT_SECRET || 'replace-me', { expiresIn: '7d' })
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

    if (!email || !otp) {
      return res.json({ success: false, message: "Missing fields" });
    }
    const superAdmin =
      await SuperAdmin.findOne({
        email
      });

    if (superAdmin) {

      if (
        superAdmin.loginOtp !== otp
      ) {
        return res.json({
          success: false,
          message: "Invalid OTP"
        });
      }

      if (
        superAdmin.loginOtpExpireAt <
        Date.now()
      ) {
        return res.json({
          success: false,
          message: "OTP expired"
        });
      }

      superAdmin.loginOtp = "";

      superAdmin.loginOtpExpireAt = 0;

      await superAdmin.save();

      // A superadmin may ALSO be an admin (e.g. faculty) inside an organization.
      // Carry that org context in the token so the same account keeps working in
      // the regular Admin panel (forms, members, responses) too.
      const memberOrg = await mongoose.connection
        .collection("organization")
        .findOne({ "admins.email": email });

      const orgAdminEntry = memberOrg?.admins?.find(
        (a) => a.email === email
      );

      const token =
        jwt.sign(
          {
            email:
              superAdmin.email,

            role:
              superAdmin.role,

            adminId:
              superAdmin._id,

            isSuperAdmin: true,

            ...(memberOrg
              ? {
                  club: memberOrg.name,
                  orgRole: orgAdminEntry?.role,
                }
              : {}),
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "7d"
          });

      res.cookie(
        "adminToken",
        token,
        {
          httpOnly: true,
          secure:
            process.env.NODE_ENV === "production",

          sameSite:
            process.env.NODE_ENV === "production"
              ? "none"
              : "strict",

          maxAge:
            7 * 24 * 60 * 60 * 1000
        }
      );

      return res.json({
        success: true,
        role:
          superAdmin.role,
        message:
          "Login successful"
      });

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
      { email: admin.email, club: club, role: admin.role, adminId: admin.userId },
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
    if (
      req.admin?.role === "director" ||
      req.admin?.role === "principal" ||
      req.admin?.role === "jd"
    ) {

      return res.json({
        success: true,
        data: {
          name: req.admin.email,
          email: req.admin.email,
          role: req.admin.role
        }
      });

    }
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
        role: admin.role || 'Admin',
        avatar: org.logo || org.img,
        club: {
          id: org.abbr || club,
          name: org.name || club,
          abbr: org.abbr || club,
          logo: org.logo || org.img,
          role: admin.role || 'Admin'
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

// ── Secretary management ─────────────────────────────────────────────
// A secretary is an entry in the organization's `admins` array with
// role === "secretary". Per the role model, only a FACULTY of the club
// may add/remove secretaries. We verify the caller's org role from the
// org document itself (not just the token) so the check is authoritative
// and also covers a superadmin who is also a faculty of this club.

const SECRETARY_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const resolveCallerOrgRole = async (req) => {
  const club = req.admin?.club || req.body?.club;
  const email = req.admin?.email || req.body?.email;
  if (!club || !email) return { org: null, me: null };
  const org = await connectOrg(club);
  const me = org?.admins?.find((a) => a.email === email) || null;
  return { org, me };
};

export const getSecretaries = async (req, res) => {
  try {
    const { org, me } = await resolveCallerOrgRole(req);
    if (!org) {
      return res.json({ success: false, message: "Organization not found" });
    }

    const secretaries = (org.admins || [])
      .filter((a) => a.role === "secretary")
      .map((a) => ({ name: a.name, email: a.email, role: a.role }));

    return res.json({
      success: true,
      secretaries,
      isFaculty: me?.role === "faculty",
    });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

export const addSecretary = async (req, res) => {
  try {
    const { org, me } = await resolveCallerOrgRole(req);
    if (!org) {
      return res.json({ success: false, message: "Organization not found" });
    }
    if (me?.role !== "faculty") {
      return res.json({ success: false, message: "Only faculty can add secretaries" });
    }

    // NOTE: `adminAuth` overwrites req.body.email with the CALLER's email (anti-
    // spoofing). The new secretary's details therefore travel in distinct fields
    // (secretaryName / secretaryEmail), mirroring the `memberEmail` convention.
    const name = typeof req.body?.secretaryName === "string" ? req.body.secretaryName.trim() : "";
    const email = typeof req.body?.secretaryEmail === "string" ? req.body.secretaryEmail.trim().toLowerCase() : "";

    if (!name || !email) {
      return res.json({ success: false, message: "Name and email are required" });
    }
    if (name.length > 100) {
      return res.json({ success: false, message: "Name is too long" });
    }
    if (email.length > 200 || !SECRETARY_EMAIL_RE.test(email)) {
      return res.json({ success: false, message: "Please enter a valid email" });
    }

    // No duplicate email among this club's admins (any role).
    const dup = (org.admins || []).some((a) => a.email?.toLowerCase() === email);
    if (dup) {
      return res.json({ success: false, message: "An admin/secretary with this email already exists in this club" });
    }

    await mongoose.connection.collection("organization").updateOne(
      { _id: org._id },
      {
        $push: {
          admins: { name, email, role: "secretary", loginOtp: "", loginOtpExpireAt: 0 },
        },
      }
    );

    return res.json({ success: true, message: "Secretary added" });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

export const removeSecretary = async (req, res) => {
  try {
    const { org, me } = await resolveCallerOrgRole(req);
    if (!org) {
      return res.json({ success: false, message: "Organization not found" });
    }
    if (me?.role !== "faculty") {
      return res.json({ success: false, message: "Only faculty can remove secretaries" });
    }

    const email = typeof req.body?.secretaryEmail === "string" ? req.body.secretaryEmail.trim().toLowerCase() : "";
    if (!email || !SECRETARY_EMAIL_RE.test(email)) {
      return res.json({ success: false, message: "Valid secretary email is required" });
    }

    // Only ever pull secretaries — never a faculty/director via this route.
    const result = await mongoose.connection.collection("organization").updateOne(
      { _id: org._id },
      { $pull: { admins: { email, role: "secretary" } } }
    );

    if (result.modifiedCount === 0) {
      return res.json({ success: false, message: "Secretary not found" });
    }

    return res.json({ success: true, message: "Secretary removed" });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

