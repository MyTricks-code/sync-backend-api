import mongoose from 'mongoose';
import 'dotenv/config';
import Event from './models/eventModel.js';
import Post from './models/post.model.js';
import connectDB from './config/mongoDB.js';

async function syncCaptions() {
  await connectDB();
  console.log('Connected to DB for caption sync...');

  const events = await Event.find({ description: null });
  console.log(`Found ${events.length} events with missing descriptions.`);

  for (const event of events) {
    const post = await Post.findOne({ instagramId: event.instagramId });
    if (post && post.caption) {
      event.description = post.caption;
      await event.save();
      console.log(`Synced caption for event: ${event.eventName}`);
    } else {
      console.log(`No caption found for ${event.eventName} (InstaID: ${event.instagramId})`);
    }
  }

  console.log('Caption sync complete.');
  process.exit(0);
}

syncCaptions().catch(err => {
  console.error(err);
  process.exit(1);
});
