import express from "express"
import { getAllEvents, getEventById } from "../controllers/eventController.js"
import { runScrapeJob } from "../jobs/scrape.job.js"

const router = express.Router()


router.get("/all", getAllEvents)


router.get("/:id", getEventById)


// Scrapes all posts from the last 15 days regardless of last run time
router.post("/scrape/trigger", async (req, res) => {
  const since15Days = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  res.json({ message: "Forced scrape started — fetching posts from the last 15 days" });
  runScrapeJob({ force: true, sinceDate: since15Days }); // fire-and-forget
});

export default router;
