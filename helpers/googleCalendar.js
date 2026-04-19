// thiws is a reference code that cloude gave --- this vishal told me
// if anyone wants to use then take reference from the below code and make your own code according to your needs
// if nishant sir you are seeing this please guide us 
//  ------------------aapke nanhe mune fe's----------







// // ─────────────────────────────────────────────────────────────
// //  calendar.service.js
// //  Upserts classified events to MongoDB + Google Calendar API
// // ─────────────────────────────────────────────────────────────
// import { google } from "googleapis";
// import Event from "../models/event.model.js";

// // Service account credentials (download JSON from Google Cloud Console)
// // Share your Google Calendar with the service_account_email in this file
// const auth = new google.auth.GoogleAuth({
//   credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
//   scopes: ["https://www.googleapis.com/auth/calendar"],
// });
// const calendar = google.calendar({ version: "v3", auth });

// // The ID of the shared Google Calendar (visible in Calendar Settings → Integrate calendar)
// const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

// /**
//  * Takes enriched posts (post + eventData), filters events, saves to DB
//  * and pushes new ones to Google Calendar.
//  *
//  * @param {Array} enrichedPosts
//  * @returns {Promise<{saved: number, skipped: number}>}
//  */
// export async function persistEvents(enrichedPosts) {
//   const eventPosts = enrichedPosts.filter((p) => p.eventData?.is_event === true);
//   console.log(`[Calendar] Persisting ${eventPosts.length} events...`);

//   let saved = 0;
//   let skipped = 0;

//   for (const post of eventPosts) {
//     const { eventData } = post;

//     // Idempotency — skip if this Instagram post was already processed
//     const existing = await Event.findOne({ instagramId: post.instagramId });
//     if (existing) { skipped++; continue; }

//     // Build the event document
//     const doc = {
//       instagramId: post.instagramId,
//       postUrl: post.postUrl,
//       clubHandle: post.clubHandle,
//       imageUrl: post.imageUrl,
//       title: eventData.title ?? "Untitled Event",
//       date: eventData.date ? new Date(eventData.date) : null,
//       time: eventData.time ?? null,
//       venue: eventData.venue ?? null,
//       registrationLink: eventData.registration_link ?? null,
//       category: eventData.category ?? "other",
//       description: eventData.description ?? post.caption.slice(0, 200),
//       postedAt: post.postedAt,
//       googleEventId: null, // filled below
//     };

//     // Push to Google Calendar if we have a date
//     if (doc.date) {
//       try {
//         const gEvent = await pushToGoogleCalendar(doc);
//         doc.googleEventId = gEvent.id;
//       } catch (err) {
//         console.error(`[GCal] Failed to push "${doc.title}":`, err.message);
//       }
//     }

//     await Event.create(doc);
//     saved++;
//     console.log(`[Calendar] Saved: "${doc.title}" by @${doc.clubHandle}`);
//   }

//   return { saved, skipped };
// }

// /**
//  * Creates a single event in Google Calendar.
//  */
// async function pushToGoogleCalendar(doc) {
//   const dateStr = doc.date.toISOString().split("T")[0]; // "YYYY-MM-DD"
//   const startDateTime = doc.time
//     ? `${dateStr}T${doc.time}:00`
//     : null;

//   const event = {
//     summary: `[${doc.clubHandle.toUpperCase()}] ${doc.title}`,
//     description: `${doc.description}\n\nSource: ${doc.postUrl}${doc.registrationLink ? `\nRegister: ${doc.registrationLink}` : ""}`,
//     location: doc.venue,
//     start: startDateTime
//       ? { dateTime: startDateTime, timeZone: "Asia/Kolkata" }
//       : { date: dateStr },
//     end: startDateTime
//       ? { dateTime: new Date(new Date(startDateTime).getTime() + 2 * 60 * 60 * 1000).toISOString(), timeZone: "Asia/Kolkata" }
//       : { date: dateStr },
//     colorId: clubColorId(doc.clubHandle),
//   };

//   const res = await calendar.events.insert({ calendarId: CALENDAR_ID, resource: event });
//   console.log(`[GCal] Created event: ${res.data.htmlLink}`);
//   return res.data;
// }

// // Map club handles to Google Calendar color IDs (1-11)
// function clubColorId(handle) {
//   const map = {
//     gdg_ait_pune: "9",    // blueberry
//     oss_ait: "2",          // sage
//     cp_club_ait: "6",      // tangerine
//   };
//   return map[handle] ?? "1";
// }
