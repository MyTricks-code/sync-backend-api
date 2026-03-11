import express from "express";

import {
  submitResponse,
  getFormResponses,
  getUserResponses,
  deleteResponse
} from "../controllers/responseController.js";

import userAuth from "../middlewares/userAuth.js";
import adminAuth from "../middlewares/adminAuth.js";

const responseRouter = express.Router();

responseRouter.post("/submit-response", userAuth, submitResponse)
responseRouter.get("/get-form-responses/:formId", adminAuth, getFormResponses)
responseRouter.get("/get-user-responses", userAuth, getUserResponses)
responseRouter.delete("/delete-response/:responseId", userAuth, deleteResponse)


export default responseRouter