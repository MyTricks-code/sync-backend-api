import 'dotenv/config';
import connectDB from './config/mongoDB.js';
import SystemAdmin from './models/systemAdminModel.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

async function test() {
  await connectDB();
  const email = 'jiteshyadav_250097@aitpune.edu.in';
  const superAdmin = await SystemAdmin.findOne({ email });
  console.log("SuperAdmin record:", superAdmin);
  
  const org = await mongoose.connection.collection("organization").findOne({ "admins.email": email });
  console.log("Org record admins containing email:", org ? org.name : null);
  process.exit(0);
}
test();
