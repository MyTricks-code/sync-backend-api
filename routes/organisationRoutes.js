import express from "express";

import {
  createOrganisation,
  addMember,
  getOrganisation,
  deleteOrganisation
} from "../controllers/organisationController.js";

import userAuth from "../middlewares/userAuth.js";

const organisationRouter = express.Router();


organisationRouter.post("/create-organisation", userAuth, createOrganisation)

organisationRouter.post("/add-member", userAuth, addMember)

organisationRouter.get("/get-organisation/:orgId", userAuth, getOrganisation)

organisationRouter.delete("/delete-organisation", userAuth, deleteOrganisation)


export default organisationRouter