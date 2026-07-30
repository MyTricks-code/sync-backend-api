import express from 'express'
import { addMember, adminLogin, adminLogout, deleteMember, getAllOrg, getAdminInfo, getAllMembers, getSecretaries, addSecretary, removeSecretary, updateBudget, getBudget, getVisionMission, updateVisionMission } from '../controllers/adminController.js'
import adminAuth from '../middlewares/adminAuth.js'
import memberIdForAdmin from '../middlewares/memberIdforAdmin.js'
import { verifyAdminOtp } from '../controllers/adminController.js'

const adminRouter = express.Router()

adminRouter.post('/send-otp', adminLogin)
adminRouter.post('/verify-otp', verifyAdminOtp)
adminRouter.post('/add-member', adminAuth, memberIdForAdmin, addMember)
adminRouter.post('/remove-member', adminAuth, memberIdForAdmin, deleteMember)
adminRouter.get('/get-org', getAllOrg)
adminRouter.get('/get-admin-info', adminAuth, getAdminInfo)
adminRouter.post('/logout', adminLogout)
adminRouter.get('/get-club-members', adminAuth, getAllMembers)
adminRouter.get('/get-secretaries', adminAuth, getSecretaries)
adminRouter.post('/add-secretary', adminAuth, addSecretary)
adminRouter.post('/remove-secretary', adminAuth, removeSecretary)
adminRouter.put('/update-budget', adminAuth, updateBudget)
adminRouter.get('/get-budget', adminAuth, getBudget)
adminRouter.get('/get-vision-mission', adminAuth, getVisionMission)
adminRouter.put('/update-vision-mission', adminAuth, updateVisionMission)

export default adminRouter