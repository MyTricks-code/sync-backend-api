import express from 'express'
import userAuth from '../middlewares/userAuth.js'
import { createTask } from '../controllers/taskController.js'

const taskRouter = express.Router()

taskRouter.post("/create-task", userAuth, createTask)

export default taskRouter