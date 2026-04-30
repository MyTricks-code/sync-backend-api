// listModels.js — run once to see what your key can access
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_TOKEN });

async function listAvailableModels() {
  try {
    const response = await ai.models.list();
    console.log("Available models for your API key:\n");
    for await (const model of response) {
      console.log(`Name        : ${model.name}`);
      console.log(`Display     : ${model.displayName}`);
      console.log(`Description : ${model.description}`);
      console.log(`Input limit : ${model.inputTokenLimit}`);
      console.log(`Output limit: ${model.outputTokenLimit}`);
      console.log("---");
    }
  } catch (err) {
    console.error("Failed to list models:", err.message);
  }
}

listAvailableModels();