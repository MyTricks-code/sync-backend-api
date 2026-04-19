import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    instagramId: { type: String, required: true, unique: true },
    postUrl: { type: String, default: null },
    eventName: { type: String, default: null },
    date: { type: String, default: null }, // "YYYY-MM-DD" or null
    time: { type: String, default: null }, // e.g. "6:00 PM" or null
    venue: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);