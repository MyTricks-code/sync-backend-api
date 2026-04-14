import mongoose from "mongoose";

const scrapeLogSchema = new mongoose.Schema(
  {
    postsScraped: {
      type: Number,
      required: true,
      default: 0,
    },
    eventsSaved: {
      type: Number,
      required: true,
      default: 0,
    },
    eventsSkipped: {
      type: Number,
      required: true,
      default: 0,
    },
    durationMs: {
      type: Number,
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Adds createdAt and updatedAt automatically
    timestamps: true,
  }
);

// Auto-delete scrape logs older than 1 week (TTL index on createdAt)
scrapeLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

// Check if the model already exists to prevent errors during hot-reloads
const ScrapeLog = mongoose.models.ScrapeLog || mongoose.model("ScrapeLog", scrapeLogSchema);

export default ScrapeLog;