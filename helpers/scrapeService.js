// ─────────────────────────────────────────────────────────────
//  scraper.service.js
//  Calls Apify's instagram-post-scraper Actor, returns raw posts
// ─────────────────────────────────────────────────────────────
import { ApifyClient } from "apify-client";

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

// All AIT Pune club Instagram handles — add/remove freely
const CLUB_HANDLES = [
  "gdsc_aitpune",
  // "ddqclub",
  // "ossclub.ait",
  // add more handles here
];

/**
 * Runs the Apify instagram-post-scraper Actor for all club handles.
 * Only fetches posts newer than `sinceDate` to avoid reprocessing.
 *
 * @param {Date} sinceDate - only return posts after this timestamp
 * @returns {Promise<Array>} raw post objects from Apify dataset
 */
export async function scrapeClubPosts(sinceDate = null) {
  const cutoff = sinceDate ?? new Date(Date.now() - 8 * 60 * 60 * 1000); // default: last 8 hrs

  console.log(`[Apify] Starting scrape for ${CLUB_HANDLES.length} handles since ${cutoff.toISOString()}`);

  const input = {
    username: CLUB_HANDLES,         // Apify accepts an array of handles
    resultsLimit: 5,               // max posts per handle per run
    // onlyPostsNewerThan: cutoff.toISOString().split("T")[0], // "YYYY-MM-DD"
    // expandOwners: false,            // skip extra profile lookups → cheaper
    // expandChildren: false,          // skip carousel children → cheaper
  };

  // .call() starts the Actor and waits for it to finish (synchronous run)
  const run = await client.actor("apify/instagram-post-scraper").call(input, {
    memory: 1024,   // MB — enough for ~30 posts per handle
    timeout: 120,   // seconds — generous for Instagram's slow responses
  });

  console.log(`[Apify] Run finished. Dataset: ${run.defaultDatasetId}`);

  // Pull all items from the dataset
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  console.log(`[Apify] Retrieved ${items.length} raw posts`);

  return items;
}

/**
 * Normalise a raw Apify post into a clean shape for the classifier.
 * Only fields we actually need downstream are kept.
 */
export function normalisePost(raw) {
  return {
    postUrl: raw.url ?? raw.shortCode ? `https://www.instagram.com/p/${raw.shortCode}/` : null,
    instagramId: raw.id ?? raw.shortCode,
    clubHandle: raw.ownerUsername ?? raw.username,
    caption: raw.caption ?? "",
    postedAt: raw.timestamp ? new Date(raw.timestamp) : new Date(),
    likesCount: raw.likesCount ?? 0,
    imageUrl: raw.displayUrl ?? null,
  };
}
