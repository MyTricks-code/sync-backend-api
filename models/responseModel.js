import mongoose from "mongoose";

const responseSchema = new mongoose.Schema({

  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "form",
    required: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  answers: {
    type: Object,
    default: {}
  },

  review: [
    {
      reviewerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },

      reviewerName: String,

      reviewerRole: {
        type: String,
        enum: ["admin","member"]
      },

      scores: {
        communication: Number,
        technical: Number,
        interest: Number,
        behaviour: Number,
        other: Number
      },

      totalScore: Number,

      comment: String,

      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],

  averageScore: {
    type: Number,
    default: 0
  },

  decision: {
    type: String,
    enum: ["pending","accepted","rejected","reviewLater"],
    default: "pending"
  }


}, { timestamps: true });

const responseModel =
  mongoose.models.response ||
  mongoose.model("response", responseSchema);

export default responseModel;