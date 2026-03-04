import formModel from "../models/formsModel.js";
import userModel from "../models/userModel.js";

export const createForm = async (req, res)=>{

    if(!req.body){
        return res.json({success: false, message: "Empty Request body"})
    }

    const userId = req.userId
    const {title, desc, isPublic , year, viewers, fields} = req.body
    if(!title || !desc || !userId || !year  || !fields){
        return res.json({success: false, message: "Missing Credentials"})
    }
    try{
        const user = await userModel.findById(userId)
        if(!user){
            return res.json({success: false, message: "Invalid Creator Details"})
        }

        const form = await formModel.create({
            title: title,
            desc: desc,
            createdBy: userId,
            isPublic: isPublic,
            year: year,
            viewers: viewers,
            fields: fields
        })
        await userModel.findByIdAndUpdate(
            userId,
            { $push: { forms: form._id } }
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
    const {formId} = req.body;
    const userId = req.userId
    if (!formId || !userId) {
        return res.json({
            success: false,
            message: "Missing credentials"
        });
    }
    try {
        const allowedFields = ['title', 'desc', 'callSigns', 'viewers', 'fields', 'isPublic'];
        const updates = {};
        for (let key of allowedFields) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }
        const form = await formModel.findOneAndUpdate(
            { _id: formId, createdBy: userId },
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
    const {formId} = req.body
    const userId = req.userId
    if (!formId || !userId) {
        return res.json({
            success: false,
            message: "Missing credentials"
        });
    }
    try{
        // @@To implement role checks
        // const user = await userModel.findById(createdBy)
        // if(user.role!=='kaptain'){
        //     return res.json({success: false, message: "Only Captains can form "})
        // }
        const form = await formModel.findOneAndDelete(
            {_id: formId, createdBy: userId}
        )
        if(!form){
            return res.json({success: false, message: "Form cant be found or unauthorized"})
        }
         return res.json({success: true, message: "Successfully Deleted form"})
    }catch(err){
        return res.json({
            success: false,
            message: "Error deleting form: ", err,
        });
    }
}

export const userSpecificForms = async (req, res) => {
  try {

    const forms = await formModel.find({ createdBy: req.userId }).lean();

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