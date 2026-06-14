import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    instagramId: { type: String, required: true, unique: true },
    postUrl:     {type : String, unique:true},
    clubHandle:  { type: String, index: true },
    caption:     String,
    imageUrl:    String,
    postedAt:    Date,
    likesCount:  Number,
  },
  { timestamps: true }
);

// TTL: auto-delete posts 6 months after they were created.
postSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 * 6 }
);

export default mongoose.model("Post", postSchema);