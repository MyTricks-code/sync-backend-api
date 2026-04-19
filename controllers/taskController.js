import taskModel from "../models/taskModel.js";
import userModel from "../models/userModel.js";

export const createTask = async (req, res)=>{
    if(!req.body){
        return res.json({
            success : false,
            message : "No req body"
        })
    }
    const {title, desc, assigners_id} = req.body;
    try{
        const userId = req.userId
        if(!userId){
            return res.json({success: false, message: "Not Authorized"})
        }
        const user = await userModel.findById(userId)
        await taskModel.create({
            owner : user.name,
            owner_id: userId,
            title,
            desc,
            assigners_ids : assigners_id
        })
        return res.json({success: true, message: "Successfully created task"})
    }catch(err){
        return res.json({
            success : false,
            message: "Error creating task" + err
        })
    }
}