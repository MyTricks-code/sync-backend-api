import 'dotenv/config';
import mongoose from 'mongoose';

/**
 * Seed / create organizations (clubs).
 *
 * The `organization` model is intentionally disabled — orgs live directly in the
 * raw `organization` collection (see models/organizationModel.js). This script
 * writes there too, matching the rest of the codebase.
 *
 * Usage:
 *   1) Bulk seed (edit SEED_ORGS below):
 *        node misc/createOrganizations.js
 *
 *   2) Single org via CLI args:
 *        node misc/createOrganizations.js "Robotics Club" ROBO /clublogos/robo.svg
 *        node misc/createOrganizations.js "Robotics Club" ROBO /clublogos/robo.svg "Robotics & Automation Club"
 *
 * Re-running is SAFE and NON-DESTRUCTIVE: orgs are upserted by name using
 * $setOnInsert only, so existing clubs keep their admins/members/forms/etc.
 * untouched. Only brand-new orgs get the full skeleton.
 */

// Edit this list for bulk seeding (used when no CLI args are passed).
// Sourced from frontend/public/api/clubs.json (alphabetical by name).
const SEED_ORGS = [
  { name: 'CP Club',         abbr: 'CP',     clubLogo: '/clublogos/cp.svg',                 fullForm: 'Competitive Programming',                       description: 'Focused training and practice for programming contests and technical interviews.' },
  { name: 'Cultural Board',  abbr: 'CUL',    clubLogo: '/clublogos/oss.svg',                fullForm: null,                                            description: 'Oversees cultural clubs and promotes art, creativity, and cultural expression.' },
  { name: 'Cycling Club',    abbr: 'CYCLE',  clubLogo: '/clublogos/cycling.svg',            fullForm: null,                                            description: 'Promotes fitness and community through regular cycling meetups and long rides.' },
  { name: 'E-Cell',          abbr: 'ECELL',  clubLogo: '/clublogos/ecell.svg',              fullForm: 'Entrepreneurship Cell',                         description: 'Promotes entrepreneurship, innovation, and startup culture among students.' },
  { name: 'GDG AIT Pune',    abbr: 'GDG',    clubLogo: '/clublogos/google-developers.svg',  fullForm: 'Google Developer Group',                        description: 'Community-driven developer group focused on practical developer skills.' },
  { name: 'GDXR',            abbr: 'GDXR',   clubLogo: '/clublogos/gdxr.svg',               fullForm: 'Game Dev & Extended Reality Club',              description: 'Dedicated to game development, AR/VR technologies, and immersive experiences.' },
  { name: 'ISDF',            abbr: 'ISDF',   clubLogo: '/clublogos/isdf.svg',               fullForm: 'Information Security & Digital Forensics Club', description: 'Focuses on cybersecurity, ethical hacking, and digital forensics skills.' },
  { name: 'Magboard',        abbr: 'MAG',    clubLogo: '/clublogos/magboard.svg',           fullForm: 'Magazine & Editorial Board',                    description: 'Manages college magazine, newsletter writing, and creative editorial work.' },
  { name: 'Nature’s Club',   abbr: 'NATURE', clubLogo: '/clublogos/oss.svg',                fullForm: null,                                            description: 'Encourages environmental conservation, sustainability, and nature awareness.' },
  { name: 'NSS',             abbr: 'NSS',    clubLogo: '/clublogos/oss.svg',                fullForm: 'National Service Scheme',                       description: 'A volunteer organisation dedicated to social service and community development.' },
  { name: 'OSS Club',        abbr: 'OSS',    clubLogo: '/clublogos/oss.svg',                fullForm: 'Open Source Software Club',                     description: 'Encouraging students to contribute to open source projects.' },
  { name: 'PR Cell',         abbr: 'PR',     clubLogo: '/clublogos/pr.svg',                 fullForm: 'Public Relations Cell',                         description: 'Handles campus branding, outreach, media communication, and event promotions.' },
  { name: 'RnD Cell',        abbr: 'RND',    clubLogo: '/clublogos/rnd.svg',                fullForm: 'Research & Development Cell',                    description: 'Encourages research-thinking, publications, and innovation-driven projects.' },
  { name: 'Technical Board', abbr: 'TECH',   clubLogo: '/clublogos/oss.svg',                fullForm: null,                                            description: 'Central body managing all technical clubs and driving innovation.' },
];

function parseCliOrg() {
  const [name, abbr, clubLogo, fullForm] = process.argv.slice(2);
  if (!name && !abbr && !clubLogo) return null; // no CLI args -> use SEED_ORGS
  if (!name || !clubLogo) {
    console.error('Usage: node misc/createOrganizations.js "Club Name" ABBR /clublogos/logo.svg ["Full Form"]');
    process.exit(1);
  }
  return { name, abbr: abbr || null, clubLogo, fullForm: fullForm || null, description: null };
}

function validate(o) {
  if (!o.name || !o.clubLogo) {
    return `Missing required field (name/clubLogo) for "${o.name || 'unknown'}"`;
  }
  return null;
}

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('[Seed] MONGO_URI is missing from .env');
    process.exit(1);
  }

  const cliOrg = parseCliOrg();
  const orgs = cliOrg ? [cliOrg] : SEED_ORGS;

  if (orgs.length === 0) {
    console.error('[Seed] No organizations to create. Pass CLI args or fill SEED_ORGS.');
    process.exit(1);
  }

  // Validate everything before touching the DB.
  for (const o of orgs) {
    const err = validate(o);
    if (err) {
      console.error('[Seed]', err);
      process.exit(1);
    }
  }

  await mongoose.connect(mongoUri);
  console.log('[Seed] Connected to MongoDB');

  const col = mongoose.connection.collection('organization');
  let created = 0;
  let skipped = 0;

  for (const o of orgs) {
    const name = o.name.trim();
    const now = new Date();

    const result = await col.updateOne(
      { name },
      {
        // $setOnInsert ONLY — existing clubs are never modified.
        $setOnInsert: {
          name,
          abbr: o.abbr ?? null,
          clubLogo: o.clubLogo,
          fullForm: o.fullForm ?? null,
          description: o.description ?? null,
          admins: [],
          members: [],
          secretaries: [],
          forms: [],
          responses: [],
          instagramHandles: [],
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      created++;
      console.log(`[Seed] created: ${name}`);
    } else {
      skipped++;
      console.log(`[Seed] exists (untouched): ${name}`);
    }
  }

  console.log(`[Seed] Done — ${created} created, ${skipped} already existed.`);
  await mongoose.disconnect();
  console.log('[Seed] Disconnected.');
  process.exit(0);
}

run().catch(async (err) => {
  console.error('[Seed] Failed:', err.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});
