import { scrapeClubPosts, normalisePost } from "../helpers/scrapeService.js";
import { classifyPostBatch } from "../helpers/classifyService.js";
import Post from "../models/post.model.js";
import Event from "../models/eventModel.js";
import ScrapeLog from "../models/scrapelog.model.js";
import User from "../models/userModel.js";
import sendEmail from "../helpers/sendEmail.js";
import { generateEventEmail } from "../helpers/Generateeventemail.js"; // 👈 NEW

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function runScrapeJob({ force = false, sinceDate = null } = {}) {
  const actualSinceDate = sinceDate || new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

  const jobStart = Date.now();
  console.log(`[Job] Starting scrape... (force=${force}, sinceDate=${actualSinceDate.toISOString()})`);

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
    console.log("[Job] Guard bypassed — forced run. Executing scrape.");
  }

  // ── 2. Scrape & normalise posts ───────────────────────────────────────────
  const rawPosts = await scrapeClubPosts(actualSinceDate);
  const posts = rawPosts
    .map(normalisePost)
    .filter((p) => p.caption.length > 10);

  console.log(`[Job] ${posts.length} posts after normalisation`);

  // ── 3. Save new posts ─────────────────────────────────────────────────────
  let savedPosts = 0;
  const newPosts = [];

  for (const post of posts) {
    const exists = await Post.findOne({ instagramId: post.instagramId });
    if (exists) continue;
    await Post.create(post);
    newPosts.push(post);
    savedPosts++;
  }
  console.log(`[Job] ${savedPosts} new posts saved (${posts.length - savedPosts} already existed)`);

  // ── 4. Classify posts via Gemini ──────────────────────────────────────────
  let savedEvents = 0;
  let skippedEvents = 0;
  const newlyCreatedEvents = [];

  let postsToClassify = [];
  if (force) {
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

    for (const ann of announcements) {
      const description = postsToClassify.find(p => p.instagramId === ann.instagramId)?.caption ?? null;

      const result = await Event.updateOne(
        { instagramId: ann.instagramId },
        {
          $set: {
            instagramId: ann.instagramId,
            postUrl:     ann.postUrl     ?? null,
            eventName:   ann.eventName   ?? null,
            date:        ann.date        ?? null,
            time:        ann.time        ?? null,
            venue:       ann.venue       ?? null,
            club:        ann.club        ?? null,
            description,
          },
        },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        savedEvents++;
        // Attach description so the email generator has the full picture
        newlyCreatedEvents.push({ ...ann, description });
      } else {
        skippedEvents++;
      }
    }
  }

  // ── 5. Send one individual email per new event to every user ──────────────
  if (newlyCreatedEvents.length > 0) {
    console.log(`[Job] 📧 Preparing ${newlyCreatedEvents.length} individual event email(s)...`);

    try {
      const users = await User.find({}).select("email").lean();
      const emailList = users.map(u => u.email).filter(Boolean);

      if (emailList.length === 0) {
        console.log(`[Job] ⚠️ No users found in database to email.`);
      } else {
        // For each new event, generate a Gemini-crafted email and blast it to all users
        for (const ev of newlyCreatedEvents) {
          console.log(`[Job] 🤖 Generating Gemini email for: "${ev.eventName}"...`);

          const { subject, html, text } = await generateEventEmail(ev);

          console.log(`[Job] 📤 Sending "${subject}" to ${emailList.length} user(s)...`);

          const emailPromises = emailList.map(email =>
            sendEmail(email, subject, text, html) // 👈 passes html separately
          );

          const results = await Promise.allSettled(emailPromises);

          const successCount = results.filter(r => r.status === "fulfilled" && r.value === true).length;
          const failCount    = results.length - successCount;

          console.log(`[Job] ✅ Event "${ev.eventName}" — ${successCount} sent, ${failCount} failed.`);
        }
      }
    } catch (error) {
      console.error(`[Job] ❌ Error in email dispatch:`, error);
    }
  }

  // ── 6. Write scrape log ───────────────────────────────────────────────────
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