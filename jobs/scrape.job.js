import { scrapeClubPosts, normalisePost } from "../helpers/scrapeService.js";
import { classifyPostBatch } from "../helpers/classifyService.js";
import Post from "../models/post.model.js";
import Event from "../models/eventModel.js";
import ScrapeLog from "../models/scrapelog.model.js";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function runScrapeJob({ force = false, sinceDate = null } = {}) {
  const jobStart = Date.now();
  console.log(`[Job] Starting scrape... (force=${force})`);

  // ── 0. Guard: skip if a successful scrape ran within the last week ──────────
  if (!force) {
    const lastLog = await ScrapeLog.findOne().sort({ createdAt: -1 }).lean();
    if (lastLog) {
      const age = Date.now() - new Date(lastLog.createdAt).getTime();
      if (age < ONE_WEEK_MS) {
        const hoursAgo = (age / 3_600_000).toFixed(1);
        console.log(
          `[Job] Skipping — last scrape was ${hoursAgo}h ago (< 1 week). ` +
          `Next run allowed after ${new Date(new Date(lastLog.createdAt).getTime() + ONE_WEEK_MS).toISOString()}`
        );
        return;
      }
    }
  } else {
    console.log("[Job] Guard bypassed — forced run.");
  }

  // ── 1. Fetch raw posts from Apify and normalise them ───────────────────────
  const rawPosts = await scrapeClubPosts(sinceDate);
  const posts = rawPosts
    .map(normalisePost)
    .filter((p) => p.caption.length > 10); // skip empty / very short captions

  console.log(`[Job] ${posts.length} posts after normalisation`);

  // ── 2. Persist all posts to the Post collection (dedup by instagramId) ─────
  let savedPosts = 0;
  const newPosts = []; // posts that didn't exist in DB yet

  for (const post of posts) {
    const exists = await Post.findOne({ instagramId: post.instagramId });
    if (exists) continue;
    await Post.create(post);
    newPosts.push(post);
    savedPosts++;
  }
  console.log(`[Job] ${savedPosts} new posts saved (${posts.length - savedPosts} already existed)`);

  // ── 3. Determine which posts need Gemini classification ────────────────────
  //   Normal run : only new posts (saves API cost)
  //   Forced run : all scraped posts that don't have an Event yet
  let savedEvents = 0;
  let skippedEvents = 0;

  let postsToClassify = [];
  if (force) {
    // Check each scraped post — classify it if no Event record exists yet
    for (const post of posts) {
      const hasEvent = await Event.findOne({ instagramId: post.instagramId }).lean();
      if (!hasEvent) postsToClassify.push(post);
    }
    console.log(`[Job] Force mode — ${postsToClassify.length} of ${posts.length} posts unclassified, sending to Gemini...`);
  } else {
    postsToClassify = newPosts;
  }

  if (postsToClassify.length === 0) {
    console.log("[Job] All posts already classified — skipping Gemini.");
  } else {
    console.log(`[Job] Sending ${postsToClassify.length} post(s) to Gemini for classification...`);
    const announcements = await classifyPostBatch(postsToClassify);
    console.log(`[Job] Gemini found ${announcements.length} event announcement(s)`);

    // ── 4. Save each announcement as an Event (dedup by instagramId) ──────────
    for (const ann of announcements) {
      const exists = await Event.findOne({ instagramId: ann.instagramId });
      if (exists) {
        skippedEvents++;
        continue;
      }

      await Event.create({
        instagramId: ann.instagramId,
        postUrl:     ann.postUrl   ?? null,
        eventName:   ann.eventName ?? null,
        date:        ann.date      ?? null,
        time:        ann.time      ?? null,
        venue:       ann.venue     ?? null,
      });
      savedEvents++;
    }
  }

  // ── 5. Write scrape log (TTL will auto-delete it after 1 week) ─────────────
  const durationMs = Date.now() - jobStart;
  await ScrapeLog.create({
    postsScraped:  posts.length,
    eventsSaved:   savedEvents,
    eventsSkipped: skippedEvents,
    durationMs,
  });

  console.log(
    `[Job] Done in ${durationMs}ms — ` +
    `${savedPosts} new posts, ${savedEvents} events saved, ${skippedEvents} skipped.`
  );
}