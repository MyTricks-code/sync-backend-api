import express from "express";

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

responseRouter.post("/submit-response", userAuth, submitResponse)
responseRouter.get("/get-form-responses/:formId", adminOrUserAuth, getFormResponses)
responseRouter.get("/get-user-responses", userAuth, getUserResponses)
responseRouter.delete("/delete-response/:responseId", userAuth, deleteResponse)

responseRouter.post("/add-review", adminOrUserAuth, addReview)
responseRouter.post("/update-decision", adminAuth, updateDecision)

export default responseRouter