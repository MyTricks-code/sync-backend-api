import mongoose from "mongoose";

const organisationSchema = new mongoose.Schema({

  orgId: {
    type: String,
    required: true,
    unique: true
  },

  orgLogo: {
    type: String
  },

  admins: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      role: {
        type: String,
        default: "admin"
      }
    }
  ],

  members: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      role: {
        type: String,
        default: "member"
      }
    }
  ],

  forms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "form"
    }
  ],

  responses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "response"
    }
  ]

}, { timestamps: true });

const organisationModel =
  mongoose.models.organisation ||
  mongoose.model("organisation", organisationSchema);

export default organisationModel;