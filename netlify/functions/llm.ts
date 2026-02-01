import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { google } from '@ai-sdk/google';
import { createHmac, timingSafeEqual as nodeTimingSafeEqual } from 'node:crypto';

// Netlify Function (Node runtime)
// - Requires gate cookie `pf_employer_session` and verifies it server-side (HMAC-SHA256)
// - Requires Origin allowlist
// - Validates request shape and limits prompt length
// - Best-effort in-memory rate limiting (per session + IP)
// - Sanitized errors/logging (no prompt logging)

const COOKIE_NAME = 'pf_employer_session';

const PROMPT_MAX_CHARS = 4000;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX_REQUESTS = 30; // per window

type Provider = 'groq' | 'google';
type SessionPayload = { exp: number; iat: number };

function getHeader(headers: Record<string, string | undefined> | undefined, name: string): string | undefined {
  if (!headers) return undefined;
  const direct = headers[name];
  if (direct) return direct;
  const lower = headers[name.toLowerCase()];
  if (lower) return lower;
  // Netlify header objects are usually already lowercased, but be defensive.
  const foundKey = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  return foundKey ? headers[foundKey] : undefined;
}

function json(statusCode: number, body: unknown, headers?: Record<string, string>) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rawValueParts] = part.trim().split('=');
    if (!rawName) continue;
    out[rawName] = rawValueParts.length ? rawValueParts.join('=') : '';
  }
  return out;
}

function base64UrlDecodeToBytes(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64');
}

function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  try {
    // Node built-in timing safe compare
    return nodeTimingSafeEqual(a, b);
  } catch {
    // Fallback: constant-time-ish loop (still better than early-exit)
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
  }
}

function getAllowedOrigins(): Set<string> {
  const raw = process.env.LLM_ALLOWED_ORIGINS ?? process.env.EMPLOYER_ALLOWED_ORIGINS ?? '';
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

function requireOrigin(headers: Record<string, string | undefined> | undefined) {
  const origin = getHeader(headers, 'origin');
  if (!origin) return { ok: false as const, origin: undefined, error: 'Missing Origin' };
  const allowed = getAllowedOrigins();
  if (!allowed.has(origin)) return { ok: false as const, origin, error: 'Origin not allowed' };
  return { ok: true as const, origin };
}

function getClientIp(headers: Record<string, string | undefined> | undefined): string {
  const xff = getHeader(headers, 'x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || 'unknown';
  const nfIp = getHeader(headers, 'x-nf-client-connection-ip');
  if (nfIp) return nfIp.trim();
  return 'unknown';
}

function verifySessionToken(token: string): boolean {
  const secret = process.env.EMPLOYER_SESSION_SECRET ?? '';
  if (!secret) return false;

  const [payloadB64, sigB64, ...rest] = token.split('.');
  if (!payloadB64 || !sigB64 || rest.length > 0) return false;

  let payload: SessionPayload;
  try {
    const payloadJson = base64UrlDecodeToBytes(payloadB64).toString('utf8');
    payload = JSON.parse(payloadJson) as SessionPayload;
  } catch {
    return false;
  }

  if (!payload || typeof payload.exp !== 'number' || typeof payload.iat !== 'number') return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp <= nowSeconds) return false;

  // Compute expected signature = HMAC-SHA256(payloadB64)
  const expected = createHmac('sha256', secret).update(payloadB64, 'utf8').digest();

  let provided: Buffer;
  try {
    provided = base64UrlDecodeToBytes(sigB64);
  } catch {
    return false;
  }

  return timingSafeEqual(expected, provided);
}

type Bucket = { resetAtMs: number; count: number };
const buckets = new Map<string, Bucket>();

function rateLimit(key: string): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAtMs) {
    buckets.set(key, { resetAtMs: now + RATE_LIMIT_WINDOW_MS, count: 1 });
    return { allowed: true };
  }
  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAtMs - now) / 1000)) };
  }
  bucket.count += 1;
  return { allowed: true };
}

export async function handler(event: {
  httpMethod?: string;
  headers?: Record<string, string | undefined>;
  body?: string | null;
}) {
  // Enforce Origin allowlist (browser-focused, but helpful)
  const originCheck = requireOrigin(event.headers);
  if (!originCheck.ok) {
    return json(403, { error: originCheck.error }, undefined);
  }

  const corsHeaders = {
    'access-control-allow-origin': originCheck.origin,
    'access-control-allow-credentials': 'true',
    vary: 'Origin',
  };

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' }, corsHeaders);
  }

  const contentType = getHeader(event.headers, 'content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return json(415, { error: 'Content-Type must be application/json' }, corsHeaders);
  }

  // Require gate cookie and verify token
  const cookies = parseCookies(getHeader(event.headers, 'cookie'));
  const token = cookies[COOKIE_NAME];
  if (!token || !verifySessionToken(token)) {
    return json(401, { error: 'Unauthorized' }, corsHeaders);
  }

  // Best-effort rate limiting
  const ip = getClientIp(event.headers);
  const rateKey = `${token}.${ip}`;
  const rl = rateLimit(rateKey);
  if (!rl.allowed) {
    return {
      statusCode: 429,
      headers: {
        ...corsHeaders,
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'retry-after': String(rl.retryAfterSeconds),
      },
      body: JSON.stringify({ error: 'Rate limit exceeded' }),
    };
  }

  let body: unknown;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return json(400, { error: 'Invalid JSON' }, corsHeaders);
  }

  const provider = (body as { provider?: unknown }).provider;
  const prompt = (body as { prompt?: unknown }).prompt;

  if (provider !== 'groq' && provider !== 'google') {
    return json(400, { error: 'provider must be "groq" or "google"' }, corsHeaders);
  }
  if (typeof prompt !== 'string') {
    return json(400, { error: 'prompt must be a string' }, corsHeaders);
  }
  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt) {
    return json(400, { error: 'prompt must not be empty' }, corsHeaders);
  }
  if (trimmedPrompt.length > PROMPT_MAX_CHARS) {
    return json(413, { error: `prompt too long (max ${PROMPT_MAX_CHARS} chars)` }, corsHeaders);
  }

  try {
    const model =
      (provider as Provider) === 'groq' ? groq('llama-3.1-8b-instant') : google('gemini-1.5-flash');

    const result = await generateText({
      model,
      prompt: trimmedPrompt,
    });

    // Output safety: treat as plain text; return JSON only.
    return json(200, { provider, text: result.text }, corsHeaders);
  } catch (err) {
    // Error hygiene: no prompt logging, no raw upstream dumps.
    console.error('llm function error', {
      message: err instanceof Error ? err.message : String(err),
    });
    return json(500, { error: 'LLM request failed' }, corsHeaders);
  }
}

