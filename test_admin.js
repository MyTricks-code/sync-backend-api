import 'dotenv/config';
import connectDB from './config/mongoDB.js';
import { verifyAdminOtp } from './controllers/adminController.js';

async function test() {
  await connectDB();
  
  const req = {
    body: {
      email: 'jiteshyadav_250097@aitpune.edu.in',
      club: 'GDG',
      otp: '123456' // Just to get past !email || !otp
    }
  };
  
  let result = null;
  const res = {
    json: (data) => { result = data; return data; },
    cookie: () => {}
  };
  
  await verifyAdminOtp(req, res);
  console.log("verifyAdminOtp result:", result);
  process.exit(0);
}
test();
