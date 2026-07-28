import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    const orgs = await mongoose.connection.collection('organization').find({}).toArray();
    for (const org of orgs) {
      console.log(`Org: ${org.name}`);
      console.log(`Members:`, org.members);
      if (org.members && org.members.length > 0) {
        console.log(`Type of first member:`, typeof org.members[0], org.members[0].constructor.name);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
