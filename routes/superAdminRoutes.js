import express from 'express';
import { changeFaculty, createOrganization, deleteClub , getGlobalDashboard, generateIqacReport, generateQuarterReport, addFaculty, getFaculties, removeFaculty, getClubsOverview, getClubDetail, searchUsers } from '../controllers/superAdminController.js';
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

superAdminRouter.post('/add-faculty', adminAuth, roleGuard('director', 'principal', 'jd'), resolveOrg, addFaculty);

superAdminRouter.get('/faculties', adminAuth, roleGuard('director', 'principal', 'jd'), resolveOrg, getFaculties);

superAdminRouter.delete('/remove-faculty', adminAuth, roleGuard('director', 'principal', 'jd'), resolveOrg, removeFaculty);

superAdminRouter.delete('/delete-club', adminAuth, roleGuard('director', 'principal', 'jd'), deleteClub);

superAdminRouter.get('/clubs-overview', adminAuth, roleGuard('director', 'principal', 'jd'), getClubsOverview);

superAdminRouter.get('/club-detail', adminAuth, roleGuard('director', 'principal', 'jd'), getClubDetail);

superAdminRouter.get('/search-users', adminAuth, roleGuard('director', 'principal', 'jd'), searchUsers);

export default superAdminRouter;