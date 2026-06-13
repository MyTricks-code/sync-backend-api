import 'dotenv/config';
import connectDB from './config/mongoDB.js';
import { getAdminInfo } from './controllers/adminController.js';

async function test() {
  await connectDB();
  
  const req = {
    admin: {
      role: 'director',
      email: 'jiteshyadav_250097@aitpune.edu.in'
    }
  };
  
  let result = null;
  const res = {
    json: (data) => { result = data; return data; }
  };
  
  await getAdminInfo(req, res);
  console.log("getAdminInfo result:", result);
  process.exit(0);
}
test();
