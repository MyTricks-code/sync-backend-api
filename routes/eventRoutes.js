import express from "express";
import cron from "node-cron"; // Added node-cron import
import { getAllEvents, getEventById } from "../controllers/eventController.js";
import { runScrapeJob } from "../jobs/scrape.job.js";

const router = express.Router();

router.get("/all", getAllEvents);

router.get("/:id", getEventById);

// Manual trigger for testing or forced updates
router.post("/scrape/trigger", async (req, res) => {
  const since15Days = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  res.json({ message: "Forced scrape started — fetching posts from the last 15 days" });
  
  // Running in background and catching potential errors
  runScrapeJob({ force: true, sinceDate: since15Days }).catch(err => {
    console.error("Manual scrape triggered an error:", err);
  });
});


cron.schedule("0 */6 * * *", async () => {
  console.log("🕒 Cron Job Triggered: Starting scheduled 6-hour scrape...");
  try {
    const since15Days = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    
    // Await the job to ensure it finishes before logging success
    await runScrapeJob({ force: true, sinceDate: since15Days }); 
    
    console.log("✅ Scheduled scrape job completed successfully.");
  } catch (error) {
    console.error("❌ Error during scheduled scrape job:", error);
  }
});

// // Temporarily run EVERY MINUTE for testing
// cron.schedule("* * * * *", async () => {
//   console.log(" Cron Job Triggered: Testing 1-minute interval...");
//   try {
//     const since15Days = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
//     await runScrapeJob({ force: true, sinceDate: since15Days }); 
//     console.log(" Scheduled scrape job completed successfully.");
//   } catch (error) {
//     console.error(" Error during scheduled scrape job:", error);
//   }
// });
export default router;