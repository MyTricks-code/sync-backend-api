import 'dotenv/config';
import mongoose from 'mongoose';

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const orgs = await mongoose.connection.collection("organization").find({}).toArray();
  let found = false;
  for (const org of orgs) {
    if (org.members && org.members.length > 0) {
      console.log(`Org: ${org.name}`);
      console.log(`Members count:`, org.members.length);
      console.log(`First member:`, org.members[0], typeof org.members[0], org.members[0].constructor?.name);
      found = true;
    }
  }
  if (!found) console.log("No members found in any organization.");
  await mongoose.disconnect();
  process.exit(0);
}
test();
