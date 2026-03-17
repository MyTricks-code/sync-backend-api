import responseModel from "../models/responseModel.js";
import formModel from "../models/formsModel.js";
import mongoose from "mongoose";
import userModel from "../models/userModel.js";
import cloudinary from "../config/cloudinary.js";

const CLOUDINARY_HOST_REGEX = /(^|\.)res\.cloudinary\.com$/i;

const parseCloudinaryUrl = (urlValue) => {
    try {
        const parsed = new URL(urlValue);

        if (!CLOUDINARY_HOST_REGEX.test(parsed.hostname)) {
            return null;
        }

        const segments = parsed.pathname.split('/').filter(Boolean);
        const uploadIndex = segments.findIndex((segment) => segment === 'upload');

        if (uploadIndex <= 0 || uploadIndex >= segments.length - 1) {
            return null;
        }

        let startIndex = uploadIndex + 2;
        if (/^v\d+$/i.test(segments[startIndex] || '')) {
            startIndex += 1;
        }

        const publicPath = segments.slice(startIndex).join('/');
        if (!publicPath) {
            return null;
        }

        const lastDot = publicPath.lastIndexOf('.');
        const extension = lastDot > -1 ? publicPath.slice(lastDot + 1).toLowerCase() : '';
        const publicId = lastDot > -1 ? publicPath.slice(0, lastDot) : publicPath;

        return {
            inputUrl: urlValue,
            publicId,
            extension,
        };
    } catch {
        return null;
    }
};

const canOpenUrl = async (urlValue) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
        const response = await fetch(urlValue, {
            method: 'GET',
            redirect: 'follow',
            signal: controller.signal,
            headers: { Range: 'bytes=0-0' },
        });

        return response.ok;
    } catch {
        return false;
    } finally {
        clearTimeout(timeout);
    }
};

const getPossibleCloudinaryUrls = (assetInfo) => {
    const urls = new Set();

    if (!assetInfo?.inputUrl) {
        return [];
    }

    urls.add(assetInfo.inputUrl);

    if (assetInfo.extension === 'pdf') {
        if (/\/image\/upload\//i.test(assetInfo.inputUrl)) {
            urls.add(assetInfo.inputUrl.replace('/image/upload/', '/raw/upload/'));
        }

        if (/\/raw\/upload\//i.test(assetInfo.inputUrl)) {
            urls.add(assetInfo.inputUrl.replace('/raw/upload/', '/image/upload/'));
        }
    }

    const resourceTypes = ['raw', 'image'];
    const deliveryTypes = ['upload', 'authenticated'];

    resourceTypes.forEach((resourceType) => {
        deliveryTypes.forEach((deliveryType) => {
            try {
                const signed = deliveryType !== 'upload';
                const generatedUrl = cloudinary.url(assetInfo.publicId, {
                    resource_type: resourceType,
                    type: deliveryType,
                    secure: true,
                    sign_url: signed,
                    format: assetInfo.extension || undefined,
                });

                if (generatedUrl) {
                    urls.add(generatedUrl);
                }
            } catch {}
        });
    });

    if (assetInfo.extension) {
        ['raw', 'image'].forEach((resourceType) => {
            try {
                const downloadUrl = cloudinary.utils.private_download_url(
                    assetInfo.publicId,
                    assetInfo.extension,
                    {
                        resource_type: resourceType,
                        type: 'upload',
                    }
                );

                if (downloadUrl) {
                    urls.add(downloadUrl);
                }
            } catch {}
        });
    }

    return Array.from(urls);
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
    const userId = req.userId

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
                const mimeType = file?.mimetype || ''
                const fileFormat = String(file?.format || '').toLowerCase()
                const isPDF = mimeType === "application/pdf" || fileFormat === 'pdf'
                const fileName = file?.originalname || file?.original_filename || file?.filename || `file_${index}`

                answers[`file_${index}`] = {
                     url: fileUrl,
                     type: isPDF ? "pdf" : "image",
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
    const { email } = body

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

export const openUploadUrl = async (req, res) => {
    const rawUrl = String(req.query?.url || '').trim();

    if (!rawUrl) {
        return res.status(400).json({ 
            success: false, message: 'Missing upload URL' 
        });
    }

    const assetInfo = parseCloudinaryUrl(rawUrl);
    if (!assetInfo) {
        return res.status(400).json({ 
            success: false, message: 'Invalid upload URL' 
        });
    }

    const candidates = getPossibleCloudinaryUrls(assetInfo);

    for (const candidate of candidates) {
        const reachable = await canOpenUrl(candidate);
        if (reachable) {
            return res.redirect(candidate);
        }
    }

    return res.status(404).json({ 
        success: false, message: 'Uploaded file could not be resolved' 
    });
}