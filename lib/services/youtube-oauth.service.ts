import { google } from "googleapis";
import crypto from "crypto";
import { getAppUrl } from "@/lib/utils/app-url";

const YOUTUBE_READONLY_SCOPE = "https://www.googleapis.com/auth/youtube.readonly";
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const AES_ALGO = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export interface OAuthStatePayload {
  householdId: string;
  parentId: string;
  nonce: string;
  exp?: number;
}

function getEncryptionKey(): Buffer {
  const raw = process.env.YOUTUBE_OAUTH_ENCRYPTION_KEY;
  if (!raw || raw.length < 32) {
    throw new Error("YOUTUBE_OAUTH_ENCRYPTION_KEY must be set and at least 32 characters (or 64 hex chars for 32 bytes)");
  }
  if (raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  return Buffer.from(raw.slice(0, KEY_LENGTH), "utf8");
}

function getSigningKey(): Buffer {
  const key = process.env.YOUTUBE_OAUTH_ENCRYPTION_KEY;
  if (!key) throw new Error("YOUTUBE_OAUTH_ENCRYPTION_KEY required for state signing");
  return Buffer.from(key.slice(0, 32), "utf8");
}

export function createSignedState(payload: OAuthStatePayload): string {
  const exp = payload.exp ?? Date.now() + STATE_EXPIRY_MS;
  const json = JSON.stringify({ ...payload, exp });
  const hmac = crypto.createHmac("sha256", getSigningKey());
  hmac.update(json);
  const sig = hmac.digest("hex");
  const encoded = Buffer.from(json, "utf8").toString("base64url");
  return `${encoded}.${sig}`;
}

export function verifyAndDecodeState(signedState: string): OAuthStatePayload {
  const parts = signedState.split(".");
  if (parts.length !== 2) throw new Error("Invalid state format");
  const [encoded, sig] = parts;
  const json = Buffer.from(encoded, "base64url").toString("utf8");
  const hmac = crypto.createHmac("sha256", getSigningKey());
  hmac.update(json);
  if (!crypto.timingSafeEqual(Buffer.from(hmac.digest("hex")), Buffer.from(sig))) {
    throw new Error("Invalid state signature");
  }
  const payload = JSON.parse(json) as OAuthStatePayload & { exp: number };
  if (Date.now() > payload.exp) throw new Error("State expired");
  if (!payload.householdId || !payload.parentId) throw new Error("Invalid state payload");
  return payload;
}

export function encryptRefreshToken(plain: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(AES_ALGO, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decryptRefreshToken(ciphertext: string): string {
  const key = getEncryptionKey();
  const buf = Buffer.from(ciphertext, "base64url");
  if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH) throw new Error("Invalid ciphertext");
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const enc = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(AES_ALGO, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(tag);
  return decipher.update(enc) + decipher.final("utf8");
}

export function createAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = getRedirectUri();
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not set");

  const oauth2Client = new google.auth.OAuth2(clientId, process.env.GOOGLE_CLIENT_SECRET, redirectUri);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [YOUTUBE_READONLY_SCOPE],
    state,
  });
}

export async function exchangeCodeForTokens(code: string): Promise<{ refresh_token: string; access_token: string; channelId?: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = getRedirectUri();
  if (!clientId || !clientSecret) throw new Error("Google OAuth credentials not configured");

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  const refreshToken = tokens.refresh_token;
  if (!refreshToken) throw new Error("No refresh token in response");

  oauth2Client.setCredentials(tokens);
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const channels = await youtube.channels.list({ part: ["id"], mine: true });
  const channelId = channels.data.items?.[0]?.id ?? undefined;

  return {
    refresh_token: refreshToken,
    access_token: tokens.access_token ?? "",
    channelId,
  };
}

function getRedirectUri(): string {
  return `${getAppUrl()}/api/auth/youtube/callback`;
}
