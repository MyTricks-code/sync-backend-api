import responseModel from "../models/responseModel.js";
import formModel from "../models/formsModel.js";
import organisationModel from "../models/organisationModel.js"


export const submitResponse = async (req, res) => {

    if (!req.body) {
        return res.json({ success: false, message: "Empty Request body" })
    }

    const { formId, answers } = req.body
    const userId = req.userId

    if (!formId || !answers || !userId) {
        return res.json({ success: false, message: "Missing Credentials" })
    }

    try {

        const form = await formModel.findById(formId)

        if (!form) {
            return res.json({ success: false, message: "Form not found" })
        }

        const response = await responseModel.create({
            formId: formId,
            userId: userId,
            answers: answers
        })

        await organisationModel.findOneAndUpdate(
            { orgId: req.body.orgId },
            { $push: { responses: response._id } 
        })

        return res.json({
            success: true,
            message: "Response submitted successfully"
        })

    } catch (err) {
        return res.json({
            success: false,
            message: "Error submitting response",
            err
        })
    }
}



export const getFormResponses = async (req, res) => {

    const { formId } = req.params
    const userId = req.userId

    if (!formId) {
        return res.json({ success: false, message: "Missing formId" })
    }

    try {

        const form = await formModel.findById(formId)

        if (!form) {
            return res.json({ success: false, message: "Form not found" })
        }

        const responses = await responseModel.find({ formId: formId }).lean()

        return res.json({
            success: true,
            responses
        })

    } catch (err) {
        return res.json({
            success: false,
            message: "Error fetching responses",
            err: err.message
        })
    }
}



export const getUserResponses = async (req, res) => {

    const userId = req.userId

    try {

        const responses = await responseModel.find({ userId: userId }).lean()

        return res.json({
            success: true,
            responses
        })

    } catch (err) {
        return res.json({
            success: false,
            message: "Error fetching user responses",
            err
        })
    }
}



export const deleteResponse = async (req, res) => {

    const { responseId } = req.body
    const userId = req.userId

    if (!responseId || !userId) {
        return res.json({
            success: false,
            message: "Missing credentials"
        })
    }

    try {

        const response = await responseModel.findOneAndDelete({
            _id: responseId,
            userId: userId
        })

        if (!response) {
            return res.json({
                success: false,
                message: "Response not found or unauthorized"
            })
        }

        return res.json({
            success: true,
            message: "Response deleted successfully"
        })

    } catch (err) {
        return res.json({
            success: false,
            message: "Error deleting response",
            err
        })
    }
}