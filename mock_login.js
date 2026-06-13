import 'dotenv/config';
import connectDB from './config/mongoDB.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

async function test() {
  await connectDB();
  
  const email = 'jiteshyadav_250097@aitpune.edu.in';
  const club = 'GDG';
  
  const org = await mongoose.connection.collection("organization").findOne({ name: club });
  if (!org) { console.log("Org not found"); process.exit(1); }
  
  const admin = org.admins.find(a => a.email === email);
  if (!admin) { console.log("Admin not found"); process.exit(1); }
  
  console.log("Found admin:", admin);
  
  const role = admin.role?.toLowerCase() || 'admin';
  console.log("Calculated role:", role);
  
  const token = jwt.sign(
    { email: admin.email, club: club, role: role, adminId: admin.userId || null },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: "7d" }
  );
  
  console.log("Generated token payload:", jwt.decode(token));
  process.exit(0);
}
test();
