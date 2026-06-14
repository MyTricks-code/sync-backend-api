import 'dotenv/config';
import mongoose from 'mongoose';
import SuperAdmin from '../models/superAdminModel.js';

/**
 * Seed / create SuperAdmin accounts.
 *
 * Usage:
 *   1) Single admin via CLI args:
 *        node createSuperAdmin.js "Full Name" email@aitpune.edu.in director
 *      (role must be one of: director | principal | jd)
 *
 *   2) Multiple admins: edit the SEED_ADMINS array below and run:
 *        node createSuperAdmin.js
 *
 * Re-running is safe — accounts are upserted by email (no duplicates).
 */

const VALID_ROLES = ['director', 'principal', 'jd'];

// Edit this list for bulk seeding (used when no CLI args are passed).
const SEED_ADMINS = [
  { name: 'Vishal Goswami', email: 'vishalaiforkids@gmail.com', role: 'director' },
  // { name: 'Dr. B. Principal', email: 'principal@aitpune.edu.in', role: 'principal' },
  // { name: 'Dr. C. JointDirector', email: 'jd@aitpune.edu.in', role: 'jd' },
];

function parseCliAdmin() {
  const [name, email, role] = process.argv.slice(2);
  if (!name && !email && !role) return null; // no CLI args -> use SEED_ADMINS
  if (!name || !email || !role) {
    console.error('Usage: node createSuperAdmin.js "Full Name" email@domain role');
    console.error('role must be one of:', VALID_ROLES.join(', '));
    process.exit(1);
  }
  return { name, email, role };
}

function validate(admin) {
  if (!admin.name || !admin.email || !admin.role) {
    return `Missing required field (name/email/role) for ${admin.email || 'unknown'}`;
  }
  if (!VALID_ROLES.includes(admin.role)) {
    return `Invalid role "${admin.role}" for ${admin.email}. Must be: ${VALID_ROLES.join(', ')}`;
  }
  return null;
}

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('[Seed] MONGO_URI is missing from .env');
    process.exit(1);
  }

  const cliAdmin = parseCliAdmin();
  const admins = cliAdmin ? [cliAdmin] : SEED_ADMINS;

  if (admins.length === 0) {
    console.error('[Seed] No admins to create. Pass CLI args or fill the SEED_ADMINS array.');
    process.exit(1);
  }

  // Validate all before touching the DB.
  for (const a of admins) {
    const err = validate(a);
    if (err) {
      console.error('[Seed]', err);
      process.exit(1);
    }
  }

  await mongoose.connect(mongoUri);
  console.log('[Seed] Connected to MongoDB');

  for (const a of admins) {
    // Stored exactly as provided (trimmed) — login does an exact-match lookup on email.
    const email = a.email.trim();
    const result = await SuperAdmin.findOneAndUpdate(
      { email },
      {
        $set: { name: a.name.trim(), role: a.role, isActive: true },
        $setOnInsert: { email },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`[Seed] Upserted SuperAdmin → ${result.email} (${result.role})`);
  }

  await mongoose.disconnect();
  console.log('[Seed] Done. Disconnected.');
  process.exit(0);
}

run().catch(async (err) => {
  console.error('[Seed] Failed:', err.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});
