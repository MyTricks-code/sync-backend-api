import formModel from "../models/formsModel.js";
import mongoose from "mongoose";

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
    const {club} = req.body
    if(!club){
        return res.json({success: "False", message: "Missing credentials"})
    }
    const org = await mongoose.connection.collection('organization').findOne({name:  club})
    const forms = await await mongoose.connection.collection("forms").find({ _id: { $in: org.forms } }).toArray();
    return res.json({
      success: true,
      forms
    });

  } catch (err) {
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
