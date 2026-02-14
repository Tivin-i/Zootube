import { google } from "googleapis";
import crypto from "crypto";
import { getAppUrl } from "@/lib/utils/app-url";

const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const CHILD_STATE_TYPE = "child";

const SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export interface ChildOAuthStatePayload {
  type: string;
  householdId: string;
  parentId: string;
  nonce: string;
  exp?: number;
  /** Request origin so redirect URI matches when APP_URL is unset */
  redirectOrigin?: string;
}

const ENCRYPTION_KEY_HINT =
  " Set YOUTUBE_OAUTH_ENCRYPTION_KEY at runtime (e.g. Cloudflare Worker env vars / Secrets, or .dev.vars for local preview).";

function getSigningKey(): Buffer {
  const key = process.env.YOUTUBE_OAUTH_ENCRYPTION_KEY;
  if (!key) throw new Error("YOUTUBE_OAUTH_ENCRYPTION_KEY required for child OAuth state signing." + ENCRYPTION_KEY_HINT);
  return Buffer.from(key.slice(0, 32), "utf8");
}

export function createSignedChildState(
  payload: Omit<ChildOAuthStatePayload, "type" | "exp">
): string {
  const exp = Date.now() + STATE_EXPIRY_MS;
  const full: ChildOAuthStatePayload = { ...payload, type: CHILD_STATE_TYPE, exp };
  const json = JSON.stringify(full);
  const hmac = crypto.createHmac("sha256", getSigningKey());
  hmac.update(json);
  const sig = hmac.digest("hex");
  const encoded = Buffer.from(json, "utf8").toString("base64url");
  return `${encoded}.${sig}`;
}

export function verifyAndDecodeChildState(signedState: string): ChildOAuthStatePayload {
  const parts = signedState.split(".");
  if (parts.length !== 2) throw new Error("Invalid state format");
  const [encoded, sig] = parts;
  const json = Buffer.from(encoded, "base64url").toString("utf8");
  const hmac = crypto.createHmac("sha256", getSigningKey());
  hmac.update(json);
  if (!crypto.timingSafeEqual(Buffer.from(hmac.digest("hex")), Buffer.from(sig))) {
    throw new Error("Invalid state signature");
  }
  const payload = JSON.parse(json) as ChildOAuthStatePayload & { exp: number };
  if (payload.type !== CHILD_STATE_TYPE) throw new Error("Invalid state type");
  if (Date.now() > payload.exp) throw new Error("State expired");
  if (!payload.householdId || !payload.parentId) throw new Error("Invalid state payload");
  return payload;
}

function getChildRedirectUri(): string {
  return `${getAppUrl()}/api/auth/child/callback`;
}

/**
 * @param requestOrigin - Origin of the request (e.g. https://voobi.app). When set, used for redirect_uri so OAuth works even if APP_URL is unset.
 */
export function createChildAuthUrl(state: string, requestOrigin?: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not set");

  const redirectUri = requestOrigin
    ? `${requestOrigin.replace(/\/$/, "")}/api/auth/child/callback`
    : getChildRedirectUri();
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

export interface ChildUserInfo {
  sub: string;
  email: string | null;
  display_name: string | null;
}

/**
 * Exchange code for tokens and fetch userinfo using fetch() so it runs on Cloudflare Workers
 * (googleapis uses Node http which triggers "validateHeaderName is not implemented").
 * @param requestOrigin - Must match the redirect_uri used in the auth URL (e.g. from state.redirectOrigin).
 */
export async function exchangeCodeForUserInfo(
  code: string,
  requestOrigin?: string
): Promise<ChildUserInfo> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = requestOrigin
    ? `${requestOrigin.replace(/\/$/, "")}/api/auth/child/callback`
    : getChildRedirectUri();
  if (!clientId || !clientSecret) throw new Error("Google OAuth credentials not configured");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });
  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${tokenRes.status} ${err}`);
  }
  const tokens = (await tokenRes.json()) as { access_token?: string };
  const accessToken = tokens.access_token;
  if (!accessToken) throw new Error("No access_token in Google token response");

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userRes.ok) {
    throw new Error(`Google userinfo failed: ${userRes.status}`);
  }
  const data = (await userRes.json()) as { id?: string; email?: string | null; name?: string | null };
  return {
    sub: data.id ?? "",
    email: data.email ?? null,
    display_name: data.name ?? null,
  };
}
