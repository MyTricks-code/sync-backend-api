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

    // 4. Connect with extended timeouts and retries
    mongoose.set('bufferTimeoutMS', 45000);
    
    let retries = 5;
    while(retries) {
        try {
            await mongoose.connect(mongoUri, {
                maxPoolSize: 10,
                minPoolSize: 2,
                connectTimeoutMS: 30000,
                socketTimeoutMS: 45000,
                serverSelectionTimeoutMS: 30000,
                family: 4
            });
            break;
        } catch (error) {
            console.error(`[Database] Initial connection failed: ${error.message}`);
            retries -= 1;
            if (!retries) {
                console.error("[Database] All connection retries failed. Exiting.");
                process.exit(1);
            }
            console.log(`[Database] Retrying connection... (${retries} retries left)`);
            await new Promise(res => setTimeout(res, 5000));
        }
    }
};

export default connectDB;
