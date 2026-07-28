import mongoose from "mongoose";
import iqacEventModel from "../models/iqacEvent.js";

// Helper function to connect to organization collection
const connectOrg = async (clubName) => {
    return await mongoose.connection.collection("organization").findOne({ name: clubName });
};

// Create a new IqacEvent
export const createIqacEvent = async (req, res) => {
    try {
        const { title, academicYear, collaborators, eventType, theme, startDate, endDate, budget, studentParticipation, facultyParticipation, description, objectives, pos } = req.body;
        
        if (!title || !academicYear) {
            return res.json({ success: false, message: "Title and academicYear are required" });
        }

        const org = await connectOrg(req.admin?.club || req.body?.club);
        if (!org) {
            return res.json({ success: false, message: "Organization not found" });
        }

        const newEvent = new iqacEventModel({
            organization: org._id,
            title,
            academicYear,
            collaborators,
            eventType,
            theme,
            startDate,
            endDate,
            budget,
            studentParticipation,
            facultyParticipation,
            description,
            objectives,
            pos
        });

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            await newEvent.save({ session });
            
            // Push to organization's iqacEvents array
            await mongoose.connection.collection('organization').updateOne(
                { _id: org._id },
                { $push: { iqacEvents: newEvent._id } },
                { session }
            );

            await session.commitTransaction();
            session.endSession();
            
            return res.json({ success: true, message: "Event created successfully", event: newEvent });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// Get all IqacEvents for the admin's organization
export const getIqacEvents = async (req, res) => {
    try {
        const org = await connectOrg(req.admin?.club || req.body?.club || req.query?.club);
        if (!org) {
            return res.json({ success: false, message: "Organization not found" });
        }

        const events = await iqacEventModel.find({ organization: org._id }).sort({ createdAt: -1 });
        return res.json({ success: true, events });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// Get a single IqacEvent by ID
export const getIqacEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const org = await connectOrg(req.admin?.club || req.body?.club || req.query?.club);
        
        if (!org) {
            return res.json({ success: false, message: "Organization not found" });
        }

        const event = await iqacEventModel.findOne({ _id: id, organization: org._id });
        if (!event) {
            return res.json({ success: false, message: "Event not found" });
        }

        return res.json({ success: true, event });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// Update an IqacEvent
export const updateIqacEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const org = await connectOrg(req.admin?.club || req.body?.club);
        
        if (!org) {
            return res.json({ success: false, message: "Organization not found" });
        }

        const event = await iqacEventModel.findOneAndUpdate(
            { _id: id, organization: org._id },
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!event) {
            return res.json({ success: false, message: "Event not found or unauthorized" });
        }

        return res.json({ success: true, message: "Event updated successfully", event });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// Delete an IqacEvent
export const deleteIqacEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const org = await connectOrg(req.admin?.club || req.body?.club);
        
        if (!org) {
            return res.json({ success: false, message: "Organization not found" });
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const event = await iqacEventModel.findOneAndDelete(
                { _id: id, organization: org._id },
                { session }
            );

            if (!event) {
                await session.abortTransaction();
                session.endSession();
                return res.json({ success: false, message: "Event not found or unauthorized" });
            }

            // Remove from organization
            await mongoose.connection.collection('organization').updateOne(
                { _id: org._id },
                { $pull: { iqacEvents: new mongoose.Types.ObjectId(id) } },
                { session }
            );

            await session.commitTransaction();
            session.endSession();

            return res.json({ success: true, message: "Event deleted successfully" });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};
