// ─────────────────────────────────────────────────────────────
//  classifier.service.js
//  Sends captions to Claude in batch and extracts event data
// ─────────────────────────────────────────────────────────────
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an event extraction assistant for a college club management platform called NEXUS at AIT Pune.
Given an Instagram post caption from a college club, decide if it announces an upcoming event.

Respond ONLY with a valid JSON object — no explanation, no markdown, no backticks.

If it IS an event announcement:
{
  "is_event": true,
  "title": "Short event name",
  "date": "YYYY-MM-DD or null if not found",
  "time": "HH:MM (24h) or null",
  "venue": "Location string or null",
  "registration_link": "URL or null",
  "category": one of ["hackathon","workshop","seminar","competition","fest","meetup","other"],
  "description": "1-sentence summary"
}

If it is NOT an event (e.g. announcements of results, appreciation posts, memes, achievements):
{
  "is_event": false
}`;

/**
 * Classifies an array of normalised posts using Claude.
 * Uses individual message calls in parallel (cheaper than batch for small counts).
 * For >50 posts, switch to Anthropic Batch API (see batchClassify below).
 *
 * @param {Array} posts - normalised post objects from scraper.service.js
 * @returns {Promise<Array>} posts enriched with .eventData field
 */
export async function classifyPosts(posts) {
  if (posts.length === 0) return [];

  console.log(`[Claude] Classifying ${posts.length} posts...`);

  // Pre-filter obvious non-events by keyword — saves ~40% API calls
  const keyword = /event|workshop|hackathon|seminar|register|fest|join us|date|venue|₹|free entry|open for/i;
  const { likely, unlikely } = posts.reduce(
    (acc, p) => {
      (keyword.test(p.caption) ? acc.likely : acc.unlikely).push(p);
      return acc;
    },
    { likely: [], unlikely: [] }
  );

  // Mark keyword-filtered posts as non-events without calling Claude
  const skipped = unlikely.map((p) => ({ ...p, eventData: { is_event: false } }));

  // Classify the remaining posts in parallel (max 10 concurrent)
  const CONCURRENCY = 10;
  const enriched = [];

  for (let i = 0; i < likely.length; i += CONCURRENCY) {
    const batch = likely.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(classifySingle));
    enriched.push(...results);
  }

  console.log(`[Claude] Done. Events found: ${enriched.filter((p) => p.eventData?.is_event).length}`);
  return [...enriched, ...skipped];
}

/**
 * Classify a single post — internal helper.
 */
async function classifySingle(post) {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Club: @${post.clubHandle}\nPosted: ${post.postedAt.toDateString()}\n\nCaption:\n${post.caption}`,
        },
      ],
    });

    const raw = msg.content[0]?.text ?? "{}";
    const eventData = JSON.parse(raw);
    return { ...post, eventData };
  } catch (err) {
    console.error(`[Claude] Failed for post ${post.instagramId}:`, err.message);
    return { ...post, eventData: { is_event: false } };
  }
}

// ─────────────────────────────────────────────────────────────
//  BATCH API VARIANT — use when post count exceeds 50
//  50% cheaper, async (takes ~10-30 min to complete)
// ─────────────────────────────────────────────────────────────
export async function batchClassify(posts) {
  const requests = posts.map((post) => ({
    custom_id: post.instagramId,
    params: {
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Club: @${post.clubHandle}\nPosted: ${post.postedAt.toDateString()}\n\nCaption:\n${post.caption}`,
        },
      ],
    },
  }));

  const batch = await anthropic.beta.messages.batches.create({ requests });
  console.log(`[Claude Batch] Created batch ${batch.id} with ${requests.length} requests`);
  return batch.id; // poll this later with pollBatchResults()
}

export async function pollBatchResults(batchId, posts) {
  let batch = await anthropic.beta.messages.batches.retrieve(batchId);
  while (batch.processing_status !== "ended") {
    await new Promise((r) => setTimeout(r, 30_000)); // wait 30s
    batch = await anthropic.beta.messages.batches.retrieve(batchId);
    console.log(`[Claude Batch] Status: ${batch.processing_status}`);
  }

  const postMap = Object.fromEntries(posts.map((p) => [p.instagramId, p]));
  const enriched = [];

  for await (const result of await anthropic.beta.messages.batches.results(batchId)) {
    const post = postMap[result.custom_id];
    if (!post) continue;
    try {
      const text = result.result.message.content[0]?.text ?? "{}";
      enriched.push({ ...post, eventData: JSON.parse(text) });
    } catch {
      enriched.push({ ...post, eventData: { is_event: false } });
    }
  }
  return enriched;
}
