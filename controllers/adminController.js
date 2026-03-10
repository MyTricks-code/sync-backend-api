import jwt from 'jsonwebtoken'
import mongoose from 'mongoose';

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

    const { email, password, club } = req.body;

    if (!email || !password || !club) {
      return res.json({ success: false, message: "Missing fields" });
    }

    const org = await connectOrg(club);

    if (!org) {
      return res.json({ success: false, message: "Organization not found" });
    }

    const admin = org.admins.find(
      (a) => a.email === email && a.password === password
    );

    if (!admin) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ email: admin.email, club: club}, process.env.JWT_SECRET || 'replace-me', { expiresIn: '7d' })
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

export const addMember = async(req, res)=>{
  /**
   * To do:
   * 1. make sure the user form responses are deleted
   * 2. user role is updated to member 
   */
  if (!req.body) {
    return res.json({ success: false, message: "Body not provided" });
  }

  const {club, memberId} = req.body

  if(!club || !memberId){
    return res.json({success: false, message: "Missing credentials"})
  }

  try{
    const org = await connectOrg(club)
    await mongoose.connection
      .collection("organization")
      .updateOne(
        { _id: org._id },
        { $addToSet: { members: new mongoose.Types.ObjectId(memberId)} }
      );
    return res.json({success: true, message: "Member added to the club"})
  }catch(err){
    return res.json({success: false, message: "Error adding members to the club", err})
  }
}

export const deleteMember = async(req, res)=>{
  // To do: user role is updated from member to rookie
  if (!req.body) {
    return res.json({ success: false, message: "Body not provided" });
  }
  const {club, memberId} = req.body
  if(!club || !memberId){
    return res.json({success: false, message: "Missing credentials"})
  }

  try{
    const org = await connectOrg(club);
    const result = await mongoose.connection.collection('organization').updateOne(
      {_id: org._id},
      {$pull: {members: new mongoose.Types.ObjectId(memberId)}}
    )
    if(result.modifiedCount==0) return res.json({ success: false, message: "user not present in members" });
    return res.json({ success: true, message: "Successfully removed the member" });
  }catch(err){
    return res.json({success: false, message: "Error deleting member: ", err})
  }
}