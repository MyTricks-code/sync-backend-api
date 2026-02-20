import sendEmail from "../helpers/sendEmail.js";
import taskModel from "../models/taskModel.js";
import userModel from "../models/userModel.js";

export const createPost = async (req, res)=>{
    if(!req.body){
        return res.json({
            success : false,
            message : "No req body"
        })
    }
    const {owner, owner_id, title, desc} = req.body;
    try{
        const owner = userModel.findby
    }catch(err){
        return res.json({
            success : false,
            message: "Error creating task" + err
        })
    }
}