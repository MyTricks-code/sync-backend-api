import express from "express";
import { getAllEvents, getEventById } from "../controllers/eventController.js";
import { runScrapeJob } from "../jobs/scrape.job.js";

const router = express.Router();

// Guard for scrape endpoints — requires SCRAPE_SECRET env var to prevent
// anyone from triggering costly Apify + Gemini API calls.
const requireScrapeSecret = (req, res, next) => {
  const secret = process.env.SCRAPE_SECRET;
  const provided = req.headers['x-scrape-secret'] || req.body?.secret;
  if (!secret || provided !== secret) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
};

router.get("/all", getAllEvents);

router.get("/:id", getEventById);

// Manual trigger for testing or forced updates
router.post("/scrape/trigger", requireScrapeSecret, async (req, res) => {
  const since8Days = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  res.json({ message: "Forced scrape started — fetching posts from the last 2 days" });
  runScrapeJob({ force: true, sinceDate: since8Days }).catch(err => {
    console.error("Manual scrape triggered an error:", err);
  });
});

// Cron run from cron-job.org — set x-scrape-secret header in cron-job.org request config
router.post("/scrape", requireScrapeSecret, async (req, res) => {
  try {
    const result = await runScrapeJob();
    return res.json(result);
  } catch (error) {
    console.error("[App] Failed to run scrape job:", error);
    return res.status(500).json({ error: "Error in scrape job" });
  }
});

// This will not work with render as vo so jata h bar bar
// cron.schedule("0 */2 * * *", async () => {
//   console.log(" Cron Job Triggered: Starting scheduled 6-hour scrape...");
//   try {
//     const since15Days = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    
//     // Await the job to ensure it finishes before logging success
//     await runScrapeJob({ force: true, sinceDate: since15Days }); 
    
//     console.log(" Scheduled scrape job completed successfully.");
//   } catch (error) {
//     console.error(" Error during scheduled scrape job:", error);
//   }
// });

// let isRunning = false; // 🔒 Job lock — prevents overlapping runs

// const triggerScrape = async () => {
//   if (isRunning) {
//     console.log("[Job] ⚠️  Already running — skipping this trigger.");
//     return;
//   }
//   isRunning = true;
//   console.log("🚀 Cron Job Triggered...");
//   try {
//     const since15Days = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
//     await runScrapeJob({ force: true, sinceDate: since15Days });
//     console.log("✅ Scheduled scrape job completed successfully.");
//   } catch (error) {
//     console.error("❌ Error during scheduled scrape job:", error);
//   } finally {
//     isRunning = false; // Always release lock even if job throws
//   }
// };

// // ▶️ Run immediately on server start
// triggerScrape();

// // 🔁 Then repeat every 10 minutes
// cron.schedule("*/10 * * * *", triggerScrape);

export default router;