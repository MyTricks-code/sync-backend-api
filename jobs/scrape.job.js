import { scrapeClubPosts, normalisePost } from "../helpers/scrapeService.js";
import Post from "../models/post.model.js";

export async function runScrapeJob() {
  console.log("[Job] Starting scrape...");

  const rawPosts = await scrapeClubPosts();
  const posts = rawPosts.map(normalisePost).filter((p) => p.caption.length > 10);

  let saved = 0;
  for (const post of posts) {
    const exists = await Post.findOne({ instagramId: post.instagramId });
    if (exists) continue;
    await Post.create(post);
    saved++;
  }

  console.log(`[Job] Done — ${saved} new posts saved.`);
}