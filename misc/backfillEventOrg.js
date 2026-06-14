import 'dotenv/config';
import mongoose from 'mongoose';
import Event from '../models/eventModel.js';
import Post from '../models/post.model.js';
import { findOrg } from '../middlewares/resolveOrg.js';

/**
 * One-off migration:
 *   1) Seed `instagramHandles` onto organization docs (so handle -> org resolution works).
 *   2) Backfill every Event.organization by looking up its Post's clubHandle.
 *
 * Safe to re-run. Edit ORG_HANDLES to match your orgs.
 */

// Map an organization NAME -> the Instagram handle(s) it owns.
const ORG_HANDLES = {
  GDG: ['gdsc_aitpune'],
  OSS: ['ossclub.ait'],
};

async function seedHandles(orgs) {
  for (const [name, handles] of Object.entries(ORG_HANDLES)) {
    const r = await orgs.updateOne(
      { name },
      { $addToSet: { instagramHandles: { $each: handles } } }
    );
    console.log(`[handles] ${name} <- ${handles.join(', ')} (matched=${r.matchedCount}, modified=${r.modifiedCount})`);
  }
}

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('[backfill] MONGO_URI missing from .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('[backfill] connected\n');

  const orgs = mongoose.connection.collection('organization');

  // 1) Seed handles so findOrg() can resolve by Instagram handle.
  await seedHandles(orgs);
  console.log('');

  // 2) Backfill events that don't yet have an organization.
  const events = await Event.find({
    $or: [{ organization: null }, { organization: { $exists: false } }],
  }).lean();

  console.log(`[backfill] ${events.length} event(s) without organization\n`);

  let linked = 0;
  let unmatched = 0;
  const cache = new Map(); // clubHandle -> org (or null)

  for (const ev of events) {
    const post = await Post.findOne({ instagramId: ev.instagramId }).select('clubHandle').lean();
    const handle = post?.clubHandle || null;

    if (!handle) {
      unmatched++;
      console.log(`  - ${ev.eventName || ev.instagramId}: no Post/handle found`);
      continue;
    }

    let org;
    if (cache.has(handle)) {
      org = cache.get(handle);
    } else {
      org = await findOrg(handle);
      cache.set(handle, org);
    }

    if (!org) {
      unmatched++;
      console.log(`  - ${ev.eventName || ev.instagramId}: handle "${handle}" -> no org`);
      continue;
    }

    await Event.updateOne(
      { _id: ev._id },
      { $set: { organization: org._id, club: ev.club || org.name } }
    );
    linked++;
    console.log(`  ✓ ${ev.eventName || ev.instagramId}: ${handle} -> ${org.name}`);
  }

  console.log(`\n[backfill] Done. linked=${linked}, unmatched=${unmatched}`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('[backfill] failed:', err.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});
