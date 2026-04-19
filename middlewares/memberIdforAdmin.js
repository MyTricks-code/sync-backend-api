import userModel from "../models/userModel.js";

const memberIdForAdmin = async (req, res, next) => {
  if (!req.body) {
    return res.json({ success: false, message: "Missing request body" });
  }
  console.log(req.body)
  const { name, memberEmail} = req.body;

  if (!memberEmail || !name) {
    return res.json({ success: false, message: "Missing credentials" });
  }

  try {
    const member = await userModel.findOne({ name:name, email:memberEmail });
    if (!member) {
      return res.json({ success: false, message: "Member not found" });
    }

     req.body = {
            ...req.body,
            memberId: member._id
            };

    next();
  } catch (err) {
    return res.json({
      success: false,
      message: "Error getting member Id",
    });
  }
};

export default memberIdForAdmin;