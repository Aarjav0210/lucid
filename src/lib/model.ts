import { google } from "@ai-sdk/google";

// Single source of truth for the model used across the app.
// Change this one line to swap models (e.g. flash-2.5, claude, etc.)
export const model = google("gemini-2.0-flash-lite");
