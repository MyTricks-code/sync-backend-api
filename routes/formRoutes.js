import express from 'express'
import { createForm, deleteForm, editForm, userSpecificForms } from '../controllers/formController.js'
import userAuth from '../middlewares/userAuth.js'

const formRouter = express.Router()

formRouter.post('/create-form', userAuth, createForm)
formRouter.get('/get-user-forms', userAuth, userSpecificForms)
formRouter.put('/edit-form', userAuth, editForm)
formRouter.delete('/delete-form', userAuth, deleteForm)

export default formRouter