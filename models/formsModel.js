import mongoose from "mongoose";

const formSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.UUID,
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
    required: true
  },

  year: {
    type: String
  },

  viewers: [
    {
      type: {
        type: mongoose.Schema.Types.UUID,
        enum: ["text", "email", "number"]
      }
    }
  ],

  fields: [
    {
      type: {
        type: String,
        required: true,
        enum: ["text", "email", "number", "textarea", "select"]
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

const formModel = mongoose.model.task || mongoose.model('form', formSchema)
export default formModel