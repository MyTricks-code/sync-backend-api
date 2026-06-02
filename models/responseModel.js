import mongoose from "mongoose";

// Ensures only properly encrypted envelopes { encrypted, iv, authTag } are stored.
// Rejects any raw/plaintext data that bypasses the controller encryption layer.
const isEncryptedEnvelope = (v) => {
  if (v === null || v === undefined) return true;
  return (
    typeof v === "object" &&
    typeof v.encrypted === "string" &&
    typeof v.iv === "string" &&
    typeof v.authTag === "string"
  );
};

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
    type: mongoose.Schema.Types.Mixed,
    default: {},
    validate: {
      validator: isEncryptedEnvelope,
      message: "answers must be a valid encrypted envelope { encrypted, iv, authTag }"
    }
  },

  priority: {
    type: Number,
    min: 1,
    max: 10,
    default: null
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
        enum: ["admin", "member"]
      },

      scores: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
        validate: {
          validator: isEncryptedEnvelope,
          message: "scores must be a valid encrypted envelope { encrypted, iv, authTag }"
        }
      },

      totalScore: Number,

      comment: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
        validate: {
          validator: isEncryptedEnvelope,
          message: "comment must be a valid encrypted envelope { encrypted, iv, authTag }"
        }
      },

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
    enum: ["pending", "accepted", "rejected", "reviewLater"],
    default: "pending"
  }


}, { timestamps: true });

responseSchema.index(
  { userId: 1, priority: 1 },
  { unique: true, partialFilterExpression: { priority: { $type: "number" } } }
);

responseSchema.index(
  { userId: 1, formId: 1 },
  { unique: true }
);

const responseModel =
  mongoose.models.response ||
  mongoose.model("response", responseSchema);

export default responseModel;