import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('connected to db');
    const org = await mongoose.connection.collection('organization').findOne({});
    console.log('Org:', org.name);
    console.log('Members:', org.members);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
