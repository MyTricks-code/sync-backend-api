import taskModel from "../models/taskModel";
import userModel from "../models/userModel";

export const createForm = async (req, res)=>{
    const {title, desc, createdBy , isPublic , year, viewers, fields} = req.body
    if(!title || !desc || !createdBy || !isPublic || !year || !viewers || !fields){
        return res.json({success: false, message: "Missing Credentials"})
    }
    try{
        const user = await userModel.findOne({createdBy})
        if(!user){
            return res.json({success: false, message: "Invalid Creator Details"})
        }
        await taskModel.create({
            title: title,
            desc: desc,
            createdBy: createdBy,
            isPublic: isPublic,
            year: year,
            viewers: viewers,
            fields: fields
        })
        return res.json({success: true, message: "Successfully Created Form"})
    }catch(err){
        return res.json({success: false, message: "Error creating form: ", err})
    }
}
