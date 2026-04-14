import express from 'express'
import Event from '../models/eventModel.js';
import { runScrapeJob } from '../jobs/scrape.job.js';

const router = express.Router();

// GET /api/events
// Query params: club, category, from (date), to (date), page, limit
router.get("/", async (req, res) => {
  try {
    const { club, category, from, to, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (club) filter.clubHandle = club;
    if (category) filter.category = category;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to)   filter.date.$lte = new Date(to);
    }

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort({ date: 1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Event.countDocuments(filter),
    ]);

    res.json({
      events,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events/upcoming — next 30 days
router.get("/upcoming", async (req, res) => {
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const events = await Event.find({ date: { $gte: now, $lte: in30 } }).sort({ date: 1 }).lean();
  res.json({ events });
});

// GET /api/events/:id
router.get("/:id", async (req, res) => {
  const event = await Event.findById(req.params.id).lean();
  if (!event) return res.status(404).json({ error: "Not found" });
  res.json({ event });
});

// POST /api/events/scrape/trigger — forced manual trigger (bypasses weekly guard)
// Scrapes all posts from the last 15 days regardless of last run time
router.post("/scrape/trigger", async (req, res) => {
  const since15Days = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  res.json({ message: "Forced scrape started — fetching posts from the last 15 days" });
  runScrapeJob({ force: true, sinceDate: since15Days }); // fire-and-forget
});

export default router;