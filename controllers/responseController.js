import responseModel from "../models/responseModel.js";
import formModel from "../models/formsModel.js";
import mongoose from "mongoose";


export const submitResponse = async (req, res) => {

    if(!req.body){
        return res.json({success:false, message:"Empty Request body"})
    }

    const { formId, answers } = req.body
    const userId = req.userId

    if(!formId || !answers || !userId){
        return res.json({success:false, message:"Missing Credentials"})
    }

    try{

        const form = await formModel.findById(formId)

        if(!form){
            return res.json({success:false, message:"Form not found"})
        }

        const response = await responseModel.create({
            formId: formId,
            userId: userId,
            answers: answers
        })

        return res.json({
            success:true,
            message:"Response submitted successfully"
        })

    }catch(err){
        return res.json({
            success:false,
            message:"Error submitting response",
            err
        })
    }
}




export const getFormResponses = async (req, res) => {

    const { formId } = req.params
    const { club, email } = req.body

    if(!formId){
        return res.json({success:false, message:"Missing formId"})
    }
    
    if(!club) {
        return res.json({success: false, message: "Unauthorized. Admin club not found."})
    }

    try{

        const org = await mongoose.connection.collection('organization').findOne({name: club})
        if(!org){
            return res.json({success: false, message: "Organization not found"})
        }

        const form = await formModel.findById(formId)

        if(!form){
            return res.json({success:false, message:"Form not found"})
        }
        
        if (form.createdBy.toString() !== org._id.toString()) {
            return res.json({success: false, message: "Unauthorized to view these responses"})
        }

        const responses = await responseModel.find({ formId: formId }).lean()

        return res.json({
            success:true,
            responses
        })

    }catch(err){
        return res.json({
            success:false,
            message:"Error fetching responses",
            err: err.message
        })
    }
}



export const getUserResponses = async (req, res) => {

    const userId = req.userId

    try{

        const responses = await responseModel.find({ userId: userId }).lean()

        return res.json({
            success:true,
            responses
        })

    }catch(err){
        return res.json({
            success:false,
            message:"Error fetching user responses",
            err
        })
    }
}



export const deleteResponse = async (req, res) => {

    const { responseId } = req.body
    const userId = req.userId

    if(!responseId || !userId){
        return res.json({
            success:false,
            message:"Missing credentials"
        })
    }

    try{

        const response = await responseModel.findOneAndDelete({
            _id: responseId,
            userId: userId
        })

        if(!response){
            return res.json({
                success:false,
                message:"Response not found or unauthorized"
            })
        }

        return res.json({
            success:true,
            message:"Response deleted successfully"
        })

    }catch(err){
        return res.json({
            success:false,
            message:"Error deleting response",
            err
        })
    }
}