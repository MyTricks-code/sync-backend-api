import mongoose from "mongoose";
import { runScrapeJob } from "../jobs/scrape.job.js";

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;

    // 1. Safety check for the environment variable
    if (!mongoUri) {
        console.error("[Database] Error: MONGO_URI is missing from .env");
        process.exit(1);
    }

    // 2. Setup listeners BEFORE connecting to ensure events are caught
    mongoose.connection.on("connected", () => {
        console.log("[Database] Connected successfully");
    });

    mongoose.connection.on("error", (err) => {
        console.error(`[Database] Connection error: ${err}`);
    });

    // 3. Register Cron Jobs once and only once
    mongoose.connection.once("open", () => {
        try {
            runScrapeJob();
            console.log("[App] Cron jobs registered");
        } catch (err) {
            console.error("[App] Failed to start cron jobs:", err);
        }
    });

    // 4. Connect
    try {
        await mongoose.connect(mongoUri);
    } catch (error) {
        console.error(`[Database] Initial connection failed: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;