import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    instagramId: { type: String, required: true, unique: true },
    postUrl:     String,
    clubHandle:  { type: String, index: true },
    caption:     String,
    imageUrl:    String,
    postedAt:    Date,
    likesCount:  Number,
  },
  { timestamps: true }
);

export default mongoose.model("Post", postSchema);