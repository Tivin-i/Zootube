/**
 * Base URL of the app (OAuth redirects, verification links, etc.).
 * Set APP_URL in .env (e.g. http://103.167.150.103:10100 or https://yourdomain.com).
 * If only host:port is set, http:// is prepended.
 */
export function getAppUrl(): string {
  const raw =
    process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const withScheme = raw.startsWith("http://") || raw.startsWith("https://")
    ? raw
    : `http://${raw}`;
  return withScheme.replace(/\/$/, "");
}
