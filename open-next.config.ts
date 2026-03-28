// open-next.config.ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // See https://opennext.js.org/cloudflare/caching for R2 caching options
  // incrementalCache: r2IncrementalCache
});
