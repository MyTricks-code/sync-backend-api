import 'dotenv/config';
import mongoose from 'mongoose';

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const superadmins = await mongoose.connection.collection("superadmins").find({}).toArray();
  console.log(JSON.stringify(superadmins, null, 2));
  await mongoose.disconnect();
  process.exit(0);
}
test();
