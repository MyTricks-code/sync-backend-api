import express from "express";
import upload from "../middlewares/upload.js"

import {
  submitResponse,
  getFormResponses,
  getUserResponses,
  deleteResponse,
  addReview,
  updateDecision
} from "../controllers/responseController.js";

import userAuth from "../middlewares/userAuth.js";
import adminAuth from "../middlewares/adminAuth.js";
import adminOrUserAuth from "../middlewares/adminOrUserAuth.js";

const responseRouter = express.Router();

const uploadResponseFiles = (req, res, next) => {
  upload.array("files")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed",
      })
    }

    return next()
  })
}

responseRouter.post("/submit-response", userAuth, uploadResponseFiles, submitResponse)
responseRouter.get("/get-form-responses/:formId", adminOrUserAuth, getFormResponses)
responseRouter.get("/get-user-responses", userAuth, getUserResponses)
responseRouter.delete("/delete-response/:responseId", userAuth, deleteResponse)

responseRouter.post("/add-review", adminOrUserAuth, addReview)
responseRouter.post("/update-decision", adminAuth, updateDecision)

export default responseRouter