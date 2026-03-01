import express from 'express'
import { createForm } from '../controllers/formController'

const formRouter = express.Router()

formRouter.post('/create-form', createForm)

export default formRouter