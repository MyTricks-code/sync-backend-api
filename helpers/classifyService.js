import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMNI_API_TOKEN });

// Model fallback chain — tried in order when a model is overloaded (503) or unavailable
// Each is a separate free-tier quota bucket so switching genuinely helps
const MODEL_CHAIN = [
  "gemini-2.5-flash",       // primary: best quality
  "gemini-2.5-flash-lite",  // fallback 1: faster, lighter
  "gemini-2.0-flash-lite",  // fallback 2: older but different quota pool
];

const CHUNK_SIZE = 5;           // posts per Gemini call
const DELAY_BETWEEN_CALLS_MS = 5_000; // 5 s between chunks
const MAX_RETRIES = 3;          // retry attempts per model before switching to next

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Extract the suggested retry delay (in ms) from a Gemini 429 error, if present.
 * Falls back to `defaultMs`.
 */
function getRetryDelayMs(error, defaultMs = 15_000) {
  try {
    const details = error?.error?.details ?? [];
    const retryInfo = details.find(
      (d) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
    );
    if (retryInfo?.retryDelay) {
      // retryDelay is a string like "7s" or "7.948351417s"
      const seconds = parseFloat(retryInfo.retryDelay);
      if (!isNaN(seconds)) return Math.ceil(seconds * 1000) + 1_000; // +1 s buffer
    }
  } catch (_) {}
  return defaultMs;
}

/**
 * Returns true if the error is a daily quota exhaustion (limit: 0 or RPD violation).
 * These won't recover until the next UTC day — no point retrying.
 */
function isDailyQuotaExhausted(error) {
  try {
    const violations = error?.error?.details?.find(
      (d) => d["@type"] === "type.googleapis.com/google.rpc.QuotaFailure"
    )?.violations ?? [];
    return violations.some((v) =>
      v.quotaId?.toLowerCase().includes("perday")
    );
  } catch (_) {
    return false;
  }
}

/**
 * Send a single chunk (≤ CHUNK_SIZE posts) to Gemini with retry on transient 429s.
 * @private
 */
async function _classifyChunk(chunk, chunkLabel = "") {
  const postsFormatted = chunk
    .map(
      (p) =>
        `ID: ${p.instagramId}\nURL: ${p.postUrl ?? "null"}\nCaption: ${p.caption}`
    )
    .join("\n---\n");

  const currentYear = new Date().getFullYear();
  const prompt = `
You are a campus event calendar assistant for AIT Pune college clubs.
This is a SHARED CALENDAR — a date is MANDATORY. If no date can be found in the caption, do NOT include that post.

## What counts as an event:
Workshop, hackathon, cultural fest, dance competition, talk, seminar, webinar, meetup, sports event — any post inviting people to attend something on a specific date.

## What to EXCLUDE:
- Result / winner announcements (past tense, no upcoming date)
- Congratulatory or appreciation posts
- Recruitment / team selection posts
- Generic motivational / awareness content
- Recap or throwback posts about past events
- Posts with NO extractable date — OMIT these entirely

## Date extraction rules (CRITICAL — read carefully):
- You MUST convert all date formats to YYYY-MM-DD
- "10th April 2026" → "2026-04-10"
- "April 10" (no year) → "${currentYear}-04-10"
- "10/04/2026" → "2026-04-10"
- "April 10-12" (range) → use first day → "${currentYear}-04-10"
- "10th-12th April" → first day → "${currentYear}-04-10"
- If ABSOLUTELY no date is mentioned → do NOT include the post

Today's date: ${new Date().toISOString().split("T")[0]}

Posts:
${postsFormatted}

Return ONLY a JSON array. Include ONLY event posts that have a date.
"date" must always be a "YYYY-MM-DD" string — never null.
Omit any post you cannot find a date for.

JSON format (no markdown, no explanation — raw JSON only):
[
  {
    "instagramId": "string",
    "postUrl": "string | null",
    "eventName": "string | null",
    "date": "YYYY-MM-DD",
    "time": "string | null",
    "venue": "string | null"
  }
]
`;

  // Try each model in the chain; move to the next if fully exhausted on 503
  for (const model of MODEL_CHAIN) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[ClassifyService] ${chunkLabel} Calling model "${model}" (attempt ${attempt}/${MAX_RETRIES})...`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        const text = response.text;
        const cleanJson = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        // Safety net: drop anything Gemini returned without a valid date
        return parsed.filter((item) => item.date && item.date !== "null");
      } catch (err) {
        const errBody = (() => {
          try { return JSON.parse(err.message); } catch (_) { return err; }
        })();

        const status = errBody?.error?.code ?? err?.status;
        const statusStr = String(status);
        const is429 = status === 429 || statusStr === "429";
        const is503 = status === 503 || statusStr === "503";
        const isRetryable = is429 || is503;

        if (!isRetryable) throw err; // e.g. 400 bad request — don't retry

        if (is429 && isDailyQuotaExhausted(errBody)) {
          console.warn(`[ClassifyService] ${chunkLabel} Daily quota exhausted on "${model}" — trying next model...`);
          break; // exit inner loop → try next model in chain
        }

        const waitMs = is503
          ? Math.min(5_000 * 2 ** (attempt - 1), 30_000) // 5s → 10s → 20s → 30s cap
          : getRetryDelayMs(errBody);

        const reason = is503 ? "503 overload" : "429 rate limit";
        console.warn(
          `[ClassifyService] ${chunkLabel} ${reason} on "${model}" attempt ${attempt}/${MAX_RETRIES}. ` +
          `Waiting ${waitMs / 1000}s...`
        );
        await sleep(waitMs);

        // If all retries for this model exhausted due to 503, try the next model
        if (attempt === MAX_RETRIES && is503) {
          console.warn(`[ClassifyService] ${chunkLabel} "${model}" still 503 after ${MAX_RETRIES} tries — switching to next model.`);
        }
      }
    }
  }

  throw new Error(`[ClassifyService] ${chunkLabel} All models in chain failed.`);
}

/**
 * Classify a batch of normalised posts.
 * Splits into chunks of CHUNK_SIZE and waits between calls to avoid
 * free-tier 429 / quota errors.
 *
 * @param {Array} posts  - array of normalised post objects (from normalisePost())
 * @returns {Promise<Array>} - array of classified announcement objects
 */
export async function classifyPostBatch(posts) {
  const results = [];
  const totalChunks = Math.ceil(posts.length / CHUNK_SIZE);

  for (let i = 0; i < posts.length; i += CHUNK_SIZE) {
    const chunk = posts.slice(i, i + CHUNK_SIZE);
    const chunkIndex = Math.floor(i / CHUNK_SIZE) + 1;
    const label = `[chunk ${chunkIndex}/${totalChunks}]`;

    console.log(`[ClassifyService] ${label} Processing ${chunk.length} posts (trying ${MODEL_CHAIN.length} model(s))...`);

    try {
      const announcements = await _classifyChunk(chunk, label);
      results.push(...announcements);
    } catch (err) {
      if (err.message === "DAILY_QUOTA_EXHAUSTED") {
        console.warn("[ClassifyService] Daily quota hit — stopping classification early.");
        break; // No point calling Gemini again today
      }
      console.error(`[ClassifyService] ${label} Skipped due to error:`, err.message);
      // Continue with next chunk for non-fatal errors
    }

    // Pace between chunks (skip delay after the last chunk)
    if (i + CHUNK_SIZE < posts.length) {
      console.log(`[ClassifyService] Waiting ${DELAY_BETWEEN_CALLS_MS / 1000}s before next chunk...`);
      await sleep(DELAY_BETWEEN_CALLS_MS);
    }
  }

  return results;
}