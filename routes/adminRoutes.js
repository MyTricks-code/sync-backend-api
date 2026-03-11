import express from 'express'
import { addMember, adminLogin, adminLogout, deleteMember, getAllOrg, getAdminInfo } from '../controllers/adminController.js'
import adminAuth from '../middlewares/adminAuth.js'

const adminRouter = express.Router()

adminRouter.post('/login', adminLogin)
adminRouter.post('/add-member', adminAuth,  addMember)
adminRouter.post('/remove-member', adminAuth, deleteMember)
adminRouter.get('/get-org', getAllOrg)
adminRouter.get('/get-admin-info', adminAuth, getAdminInfo)
adminRouter.post('/logout', adminLogout)

export default adminRouter