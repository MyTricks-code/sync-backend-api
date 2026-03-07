import organisationModel from "../models/organisationModel.js";
import userModel from "../models/userModel.js";



export const createOrganisation = async (req, res) => {

    if(!req.body){
        return res.json({success:false, message:"Empty Request body"})
    }

    const { orgId, orgLogo } = req.body
    const userId = req.userId

    if(!orgId || !userId){
        return res.json({success:false, message:"Missing credentials"})
    }

    try{

        const user = await userModel.findById(userId)

        if(!user){
            return res.json({success:false, message:"Invalid user"})
        }

        const organisation = await organisationModel.create({

            orgId: orgId,
            orgLogo: orgLogo,

            admins: [
                {
                    userId: userId,
                    role: "Faculty"
                }
            ],

            members: []

        })

        return res.json({
            success:true,
            message:"Organisation created successfully",
            organisation
        })

    }catch(err){

        return res.json({
            success:false,
            message:"Error creating organisation",
            err
        })

    }

}



export const addMember = async (req, res) => {

    const { orgId, memberId } = req.body

    if(!orgId || !memberId){
        return res.json({success:false, message:"Missing credentials"})
    }

    try{

        await organisationModel.findOneAndUpdate(

            { orgId: orgId },

            {
                $push: {
                    members: {
                        userId: memberId
                    }
                }
            }

        )

        return res.json({
            success:true,
            message:"Member added"
        })

    }catch(err){

        return res.json({
            success:false,
            message:"Error adding member",
            err
        })

    }

}



export const getOrganisation = async (req, res) => {

    const { orgId } = req.params

    if(!orgId){
        return res.json({success:false, message:"Missing orgId"})
    }

    try{

        const organisation = await organisationModel
        .findOne({ orgId: orgId })
        .populate("admins.userId")
        .populate("members.userId")
        .populate("forms")
        .populate("responses")

        return res.json({
            success:true,
            organisation
        })

    }catch(err){

        return res.json({
            success:false,
            message:"Error fetching organisation",
            err
        })

    }

}



export const deleteOrganisation = async (req, res) => {

    const { orgId } = req.body

    if(!orgId){
        return res.json({success:false, message:"Missing orgId"})
    }

    try{

        const organisation = await organisationModel.findOneAndDelete({
            orgId: orgId
        })

        if(!organisation){
            return res.json({
                success:false,
                message:"Organisation not found"
            })
        }

        return res.json({
            success:true,
            message:"Organisation deleted"
        })

    }catch(err){

        return res.json({
            success:false,
            message:"Error deleting organisation",
            err
        })

    }

}