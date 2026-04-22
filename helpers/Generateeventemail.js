import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Uses Gemini to generate a polished HTML email body for a single event.
 * @param {Object} event - The event object from classification
 * @returns {Promise<{ subject: string, html: string, text: string }>}
 */
export async function generateEventEmail(event) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
You are an email copywriter for a college campus events app. 
Given the following event details, generate a compelling, friendly, and informative email to notify students.

Event Details:
- Event Name: ${event.eventName || "Campus Event"}
- Club/Organiser (use their Instagram handle, e.g. @handle): ${event.club || "Unknown Club"}
- Date: ${event.date || "TBD"}
- Time: ${event.time || "TBD"}
- Venue: ${event.venue || "TBD"}
- Instagram Post URL: ${event.postUrl || ""}
- Description/Caption: ${event.description || ""}

Your task:
1. Write a SHORT, catchy email subject line (no more than 10 words).
2. Write the full email body in clean, inline-styled HTML. 
   - Use a white card on a light gray background.
   - Use a bold colored header banner (choose a vibrant color fitting for a college event, like deep indigo or crimson).
   - Include all event details in a neat info table (Date, Time, Venue, Club).
   - Add a prominent CTA button "View on Instagram" linking to the post URL (if available).
   - Add a friendly closing line encouraging students to attend.
   - Keep the tone energetic and fun but professional.
   - Do NOT use external CSS files or <style> tags — all styles must be inline.
   - Do NOT include <html>, <head>, or <body> tags — only the inner email content starting from a wrapper <div>.
3. Write a plain-text fallback version of the email.

Respond ONLY in this exact JSON format (no markdown, no backticks):
{
  "subject": "...",
  "html": "...",
  "text": "..."
}
`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    // Strip markdown code fences if Gemini adds them
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

    const parsed = JSON.parse(cleaned);

    if (!parsed.subject || !parsed.html || !parsed.text) {
      throw new Error("Gemini response missing required fields");
    }

    return parsed;
  } catch (err) {
    console.error(`[generateEventEmail] ❌ Gemini failed for event "${event.eventName}":`, err.message);

    // Fallback: plain structured email if Gemini fails
    return {
      subject: `🎉 New Event: ${event.eventName || "Campus Event"}`,
      html: buildFallbackHtml(event),
      text: buildFallbackText(event),
    };
  }
}

// ── Fallback builders (used if Gemini fails) ─────────────────────────────────

function buildFallbackHtml(ev) {
  return `
<div style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 32px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: #4f46e5; padding: 28px 32px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎉 ${ev.eventName || "New Campus Event"}</h1>
      <p style="color: #c7d2fe; margin: 6px 0 0; font-size: 14px;">${ev.club ? `by @${ev.club.replace(/^@/, "")}` : "by @campusclub"}</p>
    </div>
    <div style="padding: 28px 32px;">
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; width: 30%;">📅 Date</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 600;">${ev.date || "TBD"}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;">⏰ Time</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 600;">${ev.time || "TBD"}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;">📍 Venue</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 600;">${ev.venue || "TBD"}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">🏛️ Club</td>
          <td style="padding: 10px 0; color: #111827; font-weight: 600;">${ev.club ? `@${ev.club.replace(/^@/, "")}` : "TBD"}</td>
        </tr>
      </table>

      ${ev.description ? `<p style="color: #374151; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">${ev.description}</p>` : ""}

      ${ev.postUrl ? `
      <div style="text-align: center;">
        <a href="${ev.postUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
          View on Instagram →
        </a>
      </div>` : ""}

      <p style="color: #9ca3af; font-size: 13px; margin-top: 32px; text-align: center;">
        You're receiving this because you're registered on the Campus Events app.
      </p>
    </div>
  </div>
</div>`;
}

function buildFallbackText(ev) {
  return `New Event: ${ev.eventName || "Campus Event"} by ${ev.club || "Club"}
Date: ${ev.date || "TBD"} | Time: ${ev.time || "TBD"}
Venue: ${ev.venue || "TBD"}
${ev.description ? `\n${ev.description}\n` : ""}
${ev.postUrl ? `View on Instagram: ${ev.postUrl}` : ""}
`;
}