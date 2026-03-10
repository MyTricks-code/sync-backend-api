// Don't delete or use This. Organization is created directly in the db. This is solely for reference
/*
import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  clubLogo: {
    type: String,
    required: true
  },

  admins: [
    {
      name: { type: String, required: true },
      email: { type: String, required: true },
      password: { type: String, required: true }
    }
  ],

  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],

  forms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form"
    }
  ]

}, { timestamps: true });

const organizationModel = mongoose.model.organization || mongoose.model('organization', organizationSchema)
export default organizationModel
*/