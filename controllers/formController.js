import formModel from "../models/formsModel.js";
import mongoose from "mongoose";
import userModel from "../models/userModel.js";

const toObjectId = (value) => {
    if (!value || !mongoose.Types.ObjectId.isValid(value)) {
        return null;
    }

    return new mongoose.Types.ObjectId(value);
};

const isOrgAdmin = (org, userId, email) => {
    if (!org?.admins?.length) {
        return false;
    }

    return org.admins.some((admin) => {
        const matchesUserId = userId && admin.userId && admin.userId.toString() === userId.toString();
        const matchesEmail = email && admin.email === email;
        return matchesUserId || matchesEmail;
    });
};

const isOrgMember = (org, userId) => {
    if (!org?.members?.length || !userId) {
        return false;
    }

    return org.members.some((memberId) => memberId.toString() === userId.toString());
};

const findAuthorizedOrganization = async ({ userId, club, email }) => {
    const normalizedUserId = toObjectId(userId);
    console.log('[findAuthorizedOrg] userId:', userId, '| normalizedUserId:', normalizedUserId, '| club:', club, '| email:', email);

    if (club) {
        const org = await mongoose.connection.collection('organization').findOne({ name: club });
        console.log('[findAuthorizedOrg] club lookup result:', org ? org.name : 'NOT FOUND');
        if (org) {
            if (!normalizedUserId && !email) {
                return org;
            }

            if (isOrgAdmin(org, normalizedUserId || userId, email) || isOrgMember(org, normalizedUserId || userId)) {
                return org;
            }
        }
        // fall through — don't return null; try userId-based lookup below
    }

    if (!normalizedUserId) {
        console.log('[findAuthorizedOrg] no normalizedUserId, returning null');
        return null;
    }

    // Path 1: org document has the user's ID in admins or members
    const orgByDoc = await mongoose.connection.collection('organization').findOne({
        $or: [
            { "admins.userId": normalizedUserId },
            { members: normalizedUserId }
        ]
    });
    console.log('[findAuthorizedOrg] org-doc lookup result:', orgByDoc ? orgByDoc.name : 'NOT FOUND');
    if (orgByDoc) return orgByDoc;

    // Path 2 (fallback): user document stores the org IDs in user.clubs
    const userDoc = await userModel.findById(normalizedUserId).select('clubs').lean();
    console.log('[findAuthorizedOrg] user.clubs:', userDoc?.clubs);
    if (userDoc?.clubs?.length) {
        const orgByUserClubs = await mongoose.connection.collection('organization').findOne({
            _id: { $in: userDoc.clubs.map(id => new mongoose.Types.ObjectId(id)) }
        });
        console.log('[findAuthorizedOrg] user.clubs org lookup:', orgByUserClubs ? orgByUserClubs.name : 'NOT FOUND');
        return orgByUserClubs || null;
    }

    console.log('[findAuthorizedOrg] all paths exhausted, returning null');
    return null;
};

export const createForm = async (req, res)=>{

    if(!req.body){
        return res.json({success: false, message: "Empty Request body"})
    }

    const {title, desc, isPublic, fields, club} = req.body
    if(!title || !desc || !club || !fields || isPublic === undefined){
        return res.json({success: false, message: "Missing Credentials"})
    }
    
    try{
        const org = await mongoose.connection.collection('organization').findOne({name: club})
        if(!org){
            return res.json({success: false, message: "Organization not found"})
        }
        const form = await formModel.create({
            title: title,
            desc: desc,
            createdBy: org._id,
            isPublic: isPublic,
            fields: fields
        })

        await mongoose.connection
            .collection("organization")
            .updateOne(
            { _id: org._id },
            { $addToSet: { forms: new mongoose.Types.ObjectId(form._id)} }
        );
        return res.json({success: true, message: "Successfully Created Form"})
    }catch(err){
        return res.json({success: false, message: "Error creating form: ", err})
    }
}

export const editForm = async (req, res) => {
    if(!req.body){
        return res.json({success: false, message: "Empty Request body"})
    }
    const {formId, club} = req.body;
    if (!formId || !club) {
        return res.json({
            success: false,
            message: "Missing credentials"
        });
    }
    try {
        const allowedFields = ['title', 'desc', 'fields', 'isPublic'];
        const updates = {};
        for (let key of allowedFields) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }
        const org = await mongoose.connection.collection('organization').findOne({name: club})
        if(!org){
            return res.json({success: false, message: "Club not found. Try logging again"})
        }
        const form = await formModel.findOneAndUpdate(
            { _id: formId, createdBy: org._id },
            { $set: updates },
            { new: true }
        );

        if (!form) {
            return res.json({
                success: false,
                message: "Form not found or unauthorized"
            });
        }
        return res.json({
            success: true,
            message: "Form Updated successfully"
        });

    } catch (err) {
        return res.json({
            success: false,
            message: "Error updating form: ", err,
        });
    }
};

export const deleteForm = async (req, res)=>{
    if(!req.body){
        return res.json({success: false, message: "Empty Request body"})
    }
    const {formId, club} = req.body
    const org = await mongoose.connection.collection('organization').findOne({name: club})
    if (!formId || !org) {
        return res.json({
            success: false,
            message: "Missing credentials"
        });
    }
    try{
        const form = await formModel.findOneAndDelete(
            {_id: formId, createdBy: org._id}
        )
        if(!form){
            return res.json({success: false, message: "Form cant be found or unauthorized"})
        }

        await mongoose.connection.collection('organization').updateOne(
              {_id: org._id},
              {$pull: {members: new mongoose.Types.ObjectId(form._id)}}
        )
        return res.json({success: true, message: "Successfully Deleted form"})
    }catch(err){
        return res.json({
            success: false,
            message: "Error deleting form: ", err,
        });
    }
}

export const clubSpecificForms = async (req, res) => {
  try {
        const body = req.body || {};
        const club = req.query.club || body.club;
    console.log('[clubSpecificForms] req.userId:', req.userId, '| club:', club);
    const org = await findAuthorizedOrganization({
        userId: req.userId,
        club,
                email: body.email
    });

    console.log('[clubSpecificForms] org found:', org ? org.name : 'NONE', '| forms:', org?.forms?.length ?? 0);

    if(!org){
        return res.json({success: false, message: "Unauthorized to view these forms"});
    }

    if (!org.forms || org.forms.length === 0) {
        return res.json({ success: true, forms: [] });
    }

    const forms = await mongoose.connection.collection("forms").find({ _id: { $in: org.forms } }).toArray();
    console.log('[clubSpecificForms] returning', forms.length, 'forms');
    return res.json({
      success: true,
      forms
    });

  } catch (err) {
    console.error('[clubSpecificForms] error:', err);
    return res.json({
      success: false,
      message: err.message
    });
  }
};

export const getPublicForms = async (req, res) => {
  try {
    const forms = await formModel.find({ isPublic: true }).lean();
    return res.json({ success: true, forms });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

export const getFormById = async (req, res) => {
  const { formId } = req.params;
  if (!formId) return res.json({ success: false, message: 'Missing formId' });
  try {
    const form = await formModel.findById(formId).lean();
    if (!form) return res.json({ success: false, message: 'Form not found' });
    return res.json({ success: true, form });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};
