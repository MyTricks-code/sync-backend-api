import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    instagramId: { type: String, required: true, unique: true },
    postUrl: { type: String, default: null },
    club: { type: String, index: true },
    eventName: { type: String, default: null },
    date: { type: Date, default: null }, // bhai date string m kaisse store hogi, jab scrape krna hoga to date string ko date object m convert krna pdega n
    time: { type: String, default: null }, // e.g. "6:00 PM" or null
    venue: { type: String, default: null },
    description: { type: String, default: null },
  },
  { timestamps: true }
);

eventSchema.index({ date: 1 })

export default mongoose.model("Event", eventSchema);
