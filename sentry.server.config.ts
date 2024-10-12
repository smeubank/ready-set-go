import * as Sentry from "@sentry/nuxt";
import dotenv from "dotenv";

dotenv.config();

Sentry.init({
  dsn: "https://de9a6cf7846a9dd435f719ead05219e9@o673219.ingest.us.sentry.io/4508110063665152",
  debug: true,
  // Tracing
  // We recommend adjusting this value in production, or using a tracesSampler for finer control.
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
});