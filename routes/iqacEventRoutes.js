import express from "express";
import adminAuth from "../middlewares/adminAuth.js";
import { 
    createIqacEvent, 
    getIqacEvents, 
    getIqacEventById, 
    updateIqacEvent, 
    deleteIqacEvent 
} from "../controllers/iqacEventController.js";

const router = express.Router();

// Apply adminAuth middleware to all routes since IQAC events are managed by admins of the organization
router.use(adminAuth);

// Routes
router.post("/create", createIqacEvent);
router.get("/all", getIqacEvents);
router.get("/:id", getIqacEventById);
router.put("/:id", updateIqacEvent);
router.delete("/:id", deleteIqacEvent);

export default router;
