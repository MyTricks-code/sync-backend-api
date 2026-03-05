import mongoose from "mongoose";

const formSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  title : {
    type: String,
    required : true
  },

  desc : {
    type: String,
    required: true
  },

  isPublic: {
    type: Boolean,
    required: true,
    default: false
  },

  year: {
    type: String
  },

  viewers: [
    {
      type: String
    }
  ],

  fields: [
    {
      type: {
        type: String,
        required: true,
        enum: ["text", "email", "number", "textarea", "select"]
      },

      input : {
        type: String,
        required: true
      },

      required: {
        type: Boolean,
        default: false
      },

      options: {
        type: [String],
        default: []
      }
    }
  ]

}, { timestamps: true })

const formModel = mongoose.model.form || mongoose.model('form', formSchema)
export default formModel