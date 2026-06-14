import express from 'express';
import { changeFaculty, createOrganization, deleteClub , getGlobalDashboard, generateIqacReport, generateQuarterReport } from '../controllers/superAdminController.js';
import adminAuth from '../middlewares/adminAuth.js';
import { roleGuard } from '../middlewares/roleGuard.js';
import { resolveOrg } from '../middlewares/resolveOrg.js';

const superAdminRouter = express.Router();

superAdminRouter.post('/create-club', adminAuth, roleGuard('director', 'principal', 'jd'), createOrganization);

superAdminRouter.put(
  '/change-faculty',
  adminAuth,
  roleGuard('director', 'principal', 'jd'),
  changeFaculty
);

superAdminRouter.get(
 '/dashboard',
 adminAuth,
 roleGuard(
   'director',
   'principal',
   'jd'
 ),
 getGlobalDashboard
);


superAdminRouter.get(
 '/generate-iqac-report',
 adminAuth,
 roleGuard(
   'director',
   'principal',
   'jd',
   'faculty'
 ),
 resolveOrg,
 generateIqacReport
);

superAdminRouter.get(
 '/generate-quarter-report',
 adminAuth,
 roleGuard(
   'director',
   'principal',
   'jd',
   'faculty'
 ),
 generateQuarterReport
);

superAdminRouter.delete('/delete-club', adminAuth, roleGuard('director', 'principal', 'jd'), deleteClub);

export default superAdminRouter;