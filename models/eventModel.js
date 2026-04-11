import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    instagramId:      { type: String, required: true, unique: true },
    postUrl:          String,
    clubHandle:       { type: String, required: true, index: true },
    imageUrl:         String,
    title:            { type: String, required: true },
    date:             { type: Date, index: true },
    time:             String,
    venue:            String,
    registrationLink: String,
    category: {
      type: String,
      enum: ["hackathon", "workshop", "seminar", "competition", "fest", "meetup", "other"],
      default: "other",
    },
    description:    String,
    postedAt:       Date,
    googleEventId:  String,
  },
  { timestamps: true }
);


export default mongoose.model("Event", eventSchema);