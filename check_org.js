import 'dotenv/config';
import connectDB from './config/mongoDB.js';
import mongoose from 'mongoose';

async function test() {
  await connectDB();
  const org = await mongoose.connection.collection("organization").findOne({ name: "GDG" });
  console.log("Org admins:", JSON.stringify(org.admins, null, 2));
  process.exit(0);
}
test();
