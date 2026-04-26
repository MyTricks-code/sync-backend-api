import responseModel from "../models/responseModel.js";
import formModel from "../models/formsModel.js";
import mongoose from "mongoose";
import userModel from "../models/userModel.js";


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

const getFormOrganization = async (formId) => {
    const form = await formModel.findById(formId).lean();

    if (!form) {
        return { form: null, org: null };
    }

    const org = await mongoose.connection.collection('organization').findOne({ _id: form.createdBy });
    return { form, org };
};

export const submitResponse = async (req, res) => {

    if (!req.body) {
        return res.json({ success: false, message: "Empty Request body" })
    }

    const { formId, priority } = req.body
    const files = req.files
    const rawFileFieldKeys = req.body?.fileFieldKeys
    const userId = req.userId

    const fileFieldKeys = Array.isArray(rawFileFieldKeys)
        ? rawFileFieldKeys
        : rawFileFieldKeys
            ? [rawFileFieldKeys]
            : []

    let answers = req.body?.answers

    if (typeof answers === 'string') {
        try {
            answers = JSON.parse(answers)
        } catch {
            answers = {}
        }
    }

    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
        answers = {}
        Object.entries(req.body || {}).forEach(([key, value]) => {
            if (key.startsWith('answers[') && key.endsWith(']')) {
                const answerKey = key.slice(8, -1)
                answers[answerKey] = value
            }
        })
    }

    if (!formId || !userId) {
        return res.json({ success: false, message: "Missing Credentials" })
    }

    try {

        const form = await formModel.findById(formId)

        if (!form) {
            return res.json({ success: false, message: "Form not found" })
        }

        if (files && files.length) {
            files.forEach((file, index) => {
                const fileUrl = file?.path || file?.secure_url || file?.url || ''
                const fileName = file?.originalname || file?.original_filename || file?.filename || `file_${index}`

                const preferredKey = String(fileFieldKeys[index] || '').trim() || `file_${index}`
                let answerKey = preferredKey

                if (answers[answerKey] !== undefined) {
                    let suffix = 1
                    while (answers[`${preferredKey}_${suffix}`] !== undefined) {
                        suffix += 1
                    }
                    answerKey = `${preferredKey}_${suffix}`
                }

                answers[answerKey] = {
                     url: fileUrl,
                     type: "image",
                     name: fileName
                }
            })
        }


        await responseModel.create({
            formId: formId,
            userId: userId,
            answers: answers,
            priority: priority || null
        })

        return res.json({
            success: true,
            message: "Response submitted successfully"
        })

    } catch (err) {

        if (err.code === 11000) {
            return res.json({
                success: false,
                message: "Priority already used or form already submitted"
            })
        }
        
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
    const body = req.body || {}
    const { club, email } = body

    if (!formId) {
        return res.json({ success: false, message: "Missing formId" })
    }

    try {

        const { form, org } = await getFormOrganization(formId)

        if (!form) {
            return res.json({ success: false, message: "Form not found" })
        }

        if (!org) {
            return res.json({ success: false, message: "Organization not found" })
        }

        // Primary check: org's admins/members arrays
        let canAccess = isOrgAdmin(org, userId, email) || isOrgMember(org, userId)

        // Fallback: check via user document's clubs array (covers data inconsistency)
        if (!canAccess && userId && mongoose.Types.ObjectId.isValid(userId)) {
            const userDoc = await userModel.findById(userId).select('clubs').lean();
            if (userDoc?.clubs?.length) {
                canAccess = userDoc.clubs.some(
                    (clubId) => clubId.toString() === org._id.toString()
                );
            }
        }

        if (!canAccess) {
            return res.json({ success: false, message: "Unauthorized to view these responses" })
        }

        const responses = await responseModel.find({ formId: formId }).sort({ averageScore: -1 }).populate({ path: 'userId', model: userModel, select: 'name email' }).lean()
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

    const { responseId } = req.params
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

export const updateResponse = async (req, res) => {

    const { responseId } = req.params
    const userId = req.userId
    const files = req.files
    const rawFileFieldKeys = req.body?.fileFieldKeys

    const fileFieldKeys = Array.isArray(rawFileFieldKeys)
        ? rawFileFieldKeys
        : rawFileFieldKeys ? [rawFileFieldKeys] : []

    let answers = req.body?.answers
    if (typeof answers === 'string') {
        try { answers = JSON.parse(answers) } catch { answers = {} }
    }
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
        answers = {}
    }

    const { priority } = req.body

    if (!responseId || !userId) {
        return res.json({ success: false, message: "Missing credentials" })
    }

    try {
        const response = await responseModel.findOne({ _id: responseId, userId: userId })

        if (!response) {
            return res.json({ success: false, message: "Response not found or unauthorized" })
        }

        if (files && files.length) {
            files.forEach((file, index) => {
                const fileUrl = file?.path || file?.secure_url || file?.url || ''
                const fileName = file?.originalname || file?.original_filename || file?.filename || `file_${index}`
                const preferredKey = String(fileFieldKeys[index] || '').trim() || `file_${index}`
                answers[preferredKey] = { url: fileUrl, type: "image", name: fileName }
            })
        }

        response.answers = answers
        if (priority !== undefined) {
            response.priority = priority ? Number(priority) : null
        }

        await response.save()

        return res.json({ success: true, message: "Response updated successfully" })

    } catch (err) {
        if (err.code === 11000) {
            return res.json({ success: false, message: "Priority already used by another response" })
        }
        return res.json({ success: false, message: "Error updating response", err: err.message })
    }
}

export const addReview = async (req, res) => {

    const { responseId, scores, comment, reviewerName } = req.body
    const reviewerId = req.userId
    const { email } = req.body

    if (!responseId) {
        return res.json({ success: false, message: "Missing responseId" })
    }

    try {

        const response = await responseModel.findById(responseId)

        if (!response) {
            return res.json({ success: false, message: "Response not found" })
        }

        const { form, org } = await getFormOrganization(response.formId)

        if (!form || !org) {
            return res.json({ success: false, message: "Organization not found" })
        }

        const reviewerRole = isOrgAdmin(org, reviewerId, email)
            ? "admin"
            : isOrgMember(org, reviewerId)
                ? "member"
                : null

        if (!reviewerRole) {
            return res.json({ success: false, message: "Unauthorized to review this response" })
        }

        const scoreValues = Object.values(scores || {}).filter(v => v !== undefined)

        if (scoreValues.length === 0) {
            return res.json({
                success: false,
                message: "At least one score must be provided"
            })
        }

        const totalScore = scoreValues.reduce((a, b) => a + b, 0)
        const reviewerAverage = totalScore / scoreValues.length

        response.review.push({
            reviewerId,
            reviewerName,
            reviewerRole,
            scores,
            totalScore: reviewerAverage,
            comment
        })

        const avg =
            response.review.reduce((acc, r) => acc + r.totalScore, 0) /
            response.review.length

        response.averageScore = avg

        await response.save()

        return res.json({
            success: true,
            message: "Review added",
            averageScore: avg
        })

    } catch (err) {
        return res.json({
            success: false,
            message: "Error adding review",
            err: err.message
        })
    }
}

export const updateDecision = async (req, res) => {

    const { responseId, decision } = req.body

    if (!responseId || !decision) {
        return res.json({
            success: false,
            message: "Missing credentials"
        })
    }

    try {

        if (decision === "rejected") {

            await responseModel.findByIdAndDelete(responseId)

            return res.json({
                success: true,
                message: "Applicant rejected and response deleted"
            })
        }

        await responseModel.findByIdAndUpdate(
            responseId,
            { decision }
        )

        return res.json({
            success: true,
            message: "Decision updated"
        })

    } catch (err) {
        return res.json({
            success: false,
            message: "Error updating decision",
            err: err.message
        })
    }
}

