import { getFacultyDashboard } from "../controllers/facultyController.js";

router.put(
 "/update-secretaries",
 adminAuth,
 roleGuard(
   "faculty"
 ),
 updateSecretaries
);

router.get(
 "/dashboard",
 adminAuth,
 roleGuard(
   "faculty",
   "secretary"
 ),
 getFacultyDashboard
);