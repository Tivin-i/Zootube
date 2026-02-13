import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext config for Cloudflare Workers.
 * Optional: add R2 incremental cache by installing the override and binding
 * NEXT_INC_CACHE_R2_BUCKET in wrangler.jsonc (see OpenNext Cloudflare docs).
 */
export default defineCloudflareConfig({});
