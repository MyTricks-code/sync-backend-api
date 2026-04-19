import express from 'express'
import { createForm, deleteForm, editForm, getPublicForms, getFormById, clubSpecificForms } from '../controllers/formController.js'
import adminAuth from '../middlewares/adminAuth.js'
import adminOrUserAuth from '../middlewares/adminOrUserAuth.js'

const formRouter = express.Router()

formRouter.post('/create-form', adminAuth, createForm)
formRouter.get('/get-club-forms', adminOrUserAuth, clubSpecificForms)
formRouter.put('/edit-form', adminAuth, editForm)
formRouter.delete('/delete-form', adminAuth, deleteForm)
formRouter.get('/get-public-forms', getPublicForms)
formRouter.get('/get-form/:formId', getFormById)

export default formRouter