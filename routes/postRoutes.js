import express from "express";
import Post from "../models/post.model.js";

const postRouter = express.Router();

// GET /api/posts?club=gdg_ait_pune&page=1&limit=20
postRouter.get("/", async (req, res) => {
  const { club, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (club) filter.clubHandle = club;

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ postedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean(),
    Post.countDocuments(filter),
  ]);

  res.json({ posts, pagination: { page: Number(page), limit: Number(limit), total } });
});

// POST /api/posts/scrape/trigger
postRouter.post("/scrape/trigger", async (req, res) => {
  res.json({ message: "Scrape started" });
  runScrapeJob();
});

export default postRouter;