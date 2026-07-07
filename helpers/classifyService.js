import { GoogleGenAI } from "@google/genai";

// Lazily resolved so a missing key crashes the scrape job, not the entire server boot
let ai = null;
const getAI = () => {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("[ClassifyService] Missing GEMINI_API_KEY in environment.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
};

const MODEL_CHAIN = [
  "gemini-2.5-flash",       // primary: best quality
  "gemini-2.5-flash-lite",  // fallback 1: faster, lighter
  "gemini-2.0-flash-lite",  // fallback 2: older but different quota pool
];

// ─── Tuning knobs ───────────────────────────────────────────────
const CHUNK_SIZE = 8;
const BASE_DELAY_MS = 4_000;
const MAX_RETRIES = 3;
const MAX_CONCURRENT_CHUNKS = 2;
const REQUEST_TIMEOUT_MS = 45_000;
const WORKER_STAGGER_MS = 1_500;
// ────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

function getRetryDelayMs(error, defaultMs = 15_000) {
  try {
    const details = error?.error?.details ?? [];
    const retryInfo = details.find(
      (d) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
    );
    if (retryInfo?.retryDelay) {
      const match = String(retryInfo.retryDelay).match(/^(\d+(?:\.\d+)?)/);
      if (match) return Math.ceil(parseFloat(match[1]) * 1000) + 1_000;
    }
  } catch (_) {}
  return defaultMs;
}

function isDailyQuotaExhausted(error) {
  try {
    const violations =
      error?.error?.details?.find(
        (d) => d["@type"] === "type.googleapis.com/google.rpc.QuotaFailure"
      )?.violations ?? [];
    return violations.some((v) => v.quotaId?.toLowerCase().includes("perday"));
  } catch (_) {
    return false;
  }
}

function parseErrorBody(err) {
  try {
    return JSON.parse(err.message);
  } catch (_) {
    return err;
  }
}

// Extract the outer JSON array even if the model leaks prose around it.
function extractJsonArray(text) {
  if (!text) return null;
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  if (stripped.startsWith("[")) return stripped;
  const first = stripped.indexOf("[");
  const last = stripped.lastIndexOf("]");
  if (first !== -1 && last > first) return stripped.slice(first, last + 1);
  return null;
}

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error(
        `[ClassifyService] ${label} timed out after ${ms}ms`
      );
      err.status = "TIMEOUT";
      reject(err);
    }, ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

function isValidEvent(item) {
  if (!item || typeof item !== "object") return false;
  if (!item.instagramId) return false;
  if (!item.date || item.date === "null" || item.date === "undefined") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) return false;
  const d = new Date(item.date);
  if (isNaN(d.getTime())) return false;
  return true;
}

function coerceDate(raw) {
  if (!raw || raw === "null") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const dmY = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmY)
    return `${dmY[3]}-${dmY[2].padStart(2, "0")}-${dmY[1].padStart(2, "0")}`;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  return null;
}

async function _classifyChunk(chunk, chunkLabel, state) {
  const currentYear = new Date().getFullYear();
  const postsFormatted = chunk
    .map(
      (p) =>
        `ID: ${p.instagramId}\nURL: ${p.postUrl ?? "null"}\nCaption: ${p.caption}`
    )
    .join("\n---\n");

  const prompt = `
You are a strict event-extraction engine for AIT Pune college club posts.
Your ONLY job: extract upcoming events with confirmed dates. No creativity, no guessing.

TODAY: ${new Date().toISOString().split("T")[0]}
CURRENT YEAR (default if year missing): ${currentYear}

═══════════════════════════════════════
STEP 1 — FILTER: Does this post announce a FUTURE or UPCOMING event?
═══════════════════════════════════════
✅ INCLUDE: Workshop, hackathon, fest, competition, talk, seminar, webinar, meetup, sports event
           → Must have a specific date. Must be inviting attendance.

❌ EXCLUDE (return nothing for these):
  - Winner / result announcements        ("Congratulations to...")
  - Recruitment / selection posts        ("Join our team", "Applications open")
  - Recap / throwback posts              ("Last week was amazing...")
  - Motivational / awareness content     (no event, no date)
  - Posts with ZERO extractable date     → OMIT entirely, do NOT guess

═══════════════════════════════════════
STEP 2 — DATE EXTRACTION (convert to YYYY-MM-DD, MANDATORY)
═══════════════════════════════════════
Rules (apply in order):
  1. Explicit full date  → "10th April 2026"      = "2026-04-10"
  2. Day + month only   → "April 10"              = "${currentYear}-04-10"
  3. Numeric format     → "10/04/2026"            = "2026-04-10"  (DD/MM/YYYY assumed)
  4. Date range         → "10th–12th April"       = first day = "${currentYear}-04-10"
  5. Relative ("this Saturday", "tomorrow")       = compute from TODAY
  6. No date at all     → OMIT post. Never use null. Never fabricate.

═══════════════════════════════════════
STEP 3 — FIELD EXTRACTION
═══════════════════════════════════════
eventName : Official event name from caption. If absent → null.
time      : "HH:MM" 24h or "H:MM AM/PM". If absent → null.
venue     : Room, building, platform (e.g. "Google Meet"), city. If absent → null.

DO NOT paraphrase or summarise captions. Extract only what is explicitly stated.

═══════════════════════════════════════
POSTS TO PROCESS:
═══════════════════════════════════════
${postsFormatted}

═══════════════════════════════════════
OUTPUT
═══════════════════════════════════════
Return RAW JSON array only. Zero markdown. Zero explanation. No \`\`\`json fences.
Omit any post without a confirmed date.
"date" is ALWAYS "YYYY-MM-DD" string — never null, never empty.

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

  const availableModels = MODEL_CHAIN.filter(
    (m) => !state.exhaustedModels.has(m)
  );
  if (!availableModels.length) {
    const err = new Error(
      `[ClassifyService] ${chunkLabel} All models daily-quota exhausted.`
    );
    err.reason = "daily-quota";
    throw err;
  }

  for (const model of availableModels) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(
          `[ClassifyService] ${chunkLabel} model="${model}" attempt=${attempt}/${MAX_RETRIES}`
        );

        const response = await withTimeout(
          getAI().models.generateContent({
            model,
            contents: prompt,
            config: { responseMimeType: "application/json" },
          }),
          REQUEST_TIMEOUT_MS,
          `${chunkLabel} ${model}`
        );

        const text = response.text ?? "";
        if (!text.trim()) {
          const finish = response.candidates?.[0]?.finishReason ?? "UNKNOWN";
          console.warn(
            `[ClassifyService] ${chunkLabel} Empty response (finishReason=${finish}) on attempt ${attempt}.`
          );
          if (attempt < MAX_RETRIES) continue;
          return [];
        }

        const jsonText = extractJsonArray(text);
        if (!jsonText) {
          console.warn(
            `[ClassifyService] ${chunkLabel} No JSON array in response on attempt ${attempt}.`
          );
          if (attempt < MAX_RETRIES) continue;
          return [];
        }

        let parsed;
        try {
          parsed = JSON.parse(jsonText);
        } catch (jsonErr) {
          console.warn(
            `[ClassifyService] ${chunkLabel} JSON parse failed on attempt ${attempt} — retrying...`
          );
          if (attempt < MAX_RETRIES) continue;
          return [];
        }

        if (!Array.isArray(parsed)) {
          console.warn(
            `[ClassifyService] ${chunkLabel} Non-array response — skipping chunk.`
          );
          return [];
        }

        const seen = new Set();
        const validated = [];
        let dropped = 0;
        for (const raw of parsed) {
          const item = { ...raw, date: coerceDate(raw?.date) };
          if (!isValidEvent(item)) { dropped++; continue; }
          if (seen.has(item.instagramId)) continue;
          seen.add(item.instagramId);
          validated.push(item);
        }
        if (dropped) {
          console.log(
            `[ClassifyService] ${chunkLabel} Dropped ${dropped} invalid item(s) after validation.`
          );
        }
        return validated;
      } catch (err) {
        const errBody = parseErrorBody(err);
        const status = errBody?.error?.code ?? err?.status;
        const is429 = String(status) === "429";
        const is503 = String(status) === "503";
        const isTimeout = status === "TIMEOUT";
        const isRetryable = is429 || is503 || isTimeout;

        if (!isRetryable) throw err;

        if (is429 && isDailyQuotaExhausted(errBody)) {
          state.exhaustedModels.add(model);
          console.warn(
            `[ClassifyService] ${chunkLabel} Daily RPD quota on "${model}" — model marked exhausted for this batch.`
          );
          break;
        }

        const waitMs = is503 || isTimeout
          ? Math.min(5_000 * 2 ** (attempt - 1) * state.delayMultiplier, 30_000)
          : getRetryDelayMs(errBody);

        const kind = isTimeout
          ? "timeout"
          : is503
          ? "503 overload"
          : "429 rate limit";
        console.warn(
          `[ClassifyService] ${chunkLabel} ${kind} on "${model}" ` +
            `attempt ${attempt}/${MAX_RETRIES}. Waiting ${(waitMs / 1000).toFixed(1)}s...`
        );
        await sleep(waitMs);

        if (attempt === MAX_RETRIES && (is503 || isTimeout)) {
          console.warn(
            `[ClassifyService] ${chunkLabel} "${model}" still failing after ${MAX_RETRIES} tries — switching model.`
          );
        }
      }
    }
  }

  const err = new Error(
    `[ClassifyService] ${chunkLabel} All models in chain exhausted.`
  );
  err.reason =
    state.exhaustedModels.size === MODEL_CHAIN.length ? "daily-quota" : "retries";
  throw err;
}

/**
 * Run up to `concurrency` chunk tasks at a time. Worker startups are staggered
 * so the first N chunks don't fire against the API in the same instant.
 */
async function runWithConcurrency(tasks, concurrency, staggerMs = WORKER_STAGGER_MS) {
  const results = new Array(tasks.length);
  let index = 0;

  async function worker(workerId) {
    if (workerId > 0) await sleep(staggerMs * workerId);
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  await Promise.all(
    Array.from({ length: concurrency }, (_, id) => worker(id))
  );
  return results;
}

/**
 * Classify a batch of normalised posts.
 * Chunks are processed with bounded concurrency + adaptive inter-chunk delay.
 *
 * @param {Array} posts - array of normalised post objects (from normalisePost())
 * @returns {Promise<Array>} - array of classified event objects
 */
export async function classifyPostBatch(posts) {
  if (!Array.isArray(posts) || !posts.length) return [];

  const chunks = [];
  for (let i = 0; i < posts.length; i += CHUNK_SIZE) {
    chunks.push(posts.slice(i, i + CHUNK_SIZE));
  }

  console.log(
    `[ClassifyService] ${posts.length} posts → ${chunks.length} chunks ` +
      `(size=${CHUNK_SIZE}, concurrency=${MAX_CONCURRENT_CHUNKS})`
  );

  const state = {
    exhaustedModels: new Set(),
    dailyQuotaHit: false,
    delayMultiplier: 1,
  };

  const tasks = chunks.map((chunk, idx) => async () => {
    if (state.dailyQuotaHit) return [];

    const label = `[chunk ${idx + 1}/${chunks.length}]`;

    if (idx > 0) await sleep(BASE_DELAY_MS * state.delayMultiplier);

    try {
      const result = await _classifyChunk(chunk, label, state);
      state.delayMultiplier = Math.max(1, state.delayMultiplier * 0.9);
      return result;
    } catch (err) {
      if (err.reason === "daily-quota") {
        state.dailyQuotaHit = true;
        console.warn(
          "[ClassifyService] Daily quota exhausted across all models — halting remaining chunks."
        );
        return [];
      }
      state.delayMultiplier = Math.min(state.delayMultiplier * 1.5, 4);
      console.error(
        `[ClassifyService] ${label} Skipped due to error:`,
        err.message
      );
      return [];
    }
  });

  const chunkResults = await runWithConcurrency(
    tasks,
    MAX_CONCURRENT_CHUNKS,
    WORKER_STAGGER_MS
  );

  const seen = new Set();
  const flat = [];
  for (const chunkResult of chunkResults) {
    for (const item of chunkResult) {
      if (seen.has(item.instagramId)) continue;
      seen.add(item.instagramId);
      flat.push(item);
    }
  }

  console.log(
    `[ClassifyService] Done. ${flat.length} events extracted from ${posts.length} posts.`
  );
  return flat;
}
