// open-next.config.ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Force npm instead of bun
  buildCommand: "npm run build",
});
