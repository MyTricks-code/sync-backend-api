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

}, { timestamps: true });

const responseModel =
  mongoose.models.response ||
  mongoose.model("response", responseSchema);

export default responseModel;