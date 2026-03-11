import express from 'express'
import { addMember, adminLogin, deleteMember, getAllOrg } from '../controllers/adminController.js'
import adminAuth from '../middlewares/adminAuth.js'

const adminRouter = express.Router()

adminRouter.post('/login', adminLogin)
adminRouter.post('/add-member', adminAuth,  addMember)
adminRouter.post('/remove-member', adminAuth, deleteMember)
adminRouter.get('/get-org', getAllOrg)

export default adminRouter