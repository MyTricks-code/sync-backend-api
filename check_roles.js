import 'dotenv/config';
import connectDB from './config/mongoDB.js';
import mongoose from 'mongoose';

async function test() {
  await connectDB();
  
  const email = 'jiteshyadav_250097@aitpune.edu.in';
  const superAdmin = await mongoose.connection.collection("systemadmins").findOne({ email });
  console.log("SystemAdmin role:", superAdmin ? superAdmin.role : "NOT FOUND");
  
  const org = await mongoose.connection.collection("organization").findOne({ name: "GDG" });
  if (org) {
    const admin = org.admins.find(a => a.email === email);
    console.log("GDG Admin role:", admin ? admin.role : "NOT FOUND");
  } else {
    console.log("GDG org not found");
  }
  process.exit(0);
}
test();
