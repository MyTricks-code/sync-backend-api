// ─────────────────────────────────────────────────────────────
//  scraper.service.js
//  Calls Apify's instagram-post-scraper Actor, returns raw posts
// ─────────────────────────────────────────────────────────────
import { ApifyClient } from "apify-client";

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

// All AIT Pune club Instagram handles — add/remove freely
const CLUB_HANDLES = [
  "ait_feet_tappers",
  "aitpune_official",
  "ait_2029",
  /*
  "ait_volleyball",
  "aitsportsclub",
  "culturalboard_ait",
  "ait._.basketball",
  "ait_pr_cell",
  "gdsc_aitpune",
  "ait.football",
  "aittechnicalboard",
  "robotics.club_ait",
  "ait_cycling_club",
  "ecell_ait",
  "ait_nature_club",
  "ait.athletes",
  "aitvolleyball_",
  "ait_cricket_team",
  "ait_badminton",
  "ait_meme_news",
  "ait_nss_rotaract_club",
  "filmclub_ait",
  "ait_nssclub",
  "aitkabaddi",
  "isdf_ait",
  "ait_uncensored",
  "minerva_ait",
  "ossclub.ait",
  */
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
  const cutoffDate = cutoff.toISOString().split("T")[0]; // "YYYY-MM-DD"

  console.log(`[Apify] Starting scrape for ${CLUB_HANDLES.length} handles since ${cutoffDate}`);

  const input = {
    username: CLUB_HANDLES,
    resultsLimit: 50,                      // enough posts to cover 15 days per handle
    onlyPostsNewerThan: cutoffDate,        // Apify will skip older posts → cheaper
    // expandOwners: false,
    // expandChildren: false,
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
