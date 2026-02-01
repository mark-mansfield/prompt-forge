// netlify/edge-functions/employer-auth.ts
//
// Password -> server-verified, tamper-evident session cookie (HMAC-SHA256).
// - POST: { password } -> sets HttpOnly cookie if valid
// - GET: verifies cookie -> { authorized: boolean }
//
// Env vars:
// - EMPLOYER_PASSWORD: password required for POST
// - EMPLOYER_SESSION_SECRET: HMAC secret used to sign cookies (required)
// - EMPLOYER_ALLOWED_ORIGINS: comma-separated list of allowed Origins for CORS
//   (e.g. "http://localhost:8888,https://your-site.netlify.app")

type AuthPayload = {
  exp: number; // unix seconds
  iat: number; // unix seconds
};

const COOKIE_NAME = 'pf_employer_session';
const SESSION_SECONDS = 60 * 60 * 24; // 24h

let cachedSecret: string | null = null;
let cachedKey: CryptoKey | null = null;

function getEnv(name: string): string | undefined {
  // Netlify Edge runtime provides Netlify.env.get(...)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const netlifyEnv = (globalThis as any)?.Netlify?.env;
  const hasNetlifyEnv = typeof netlifyEnv?.get === 'function';
  const netlifyValue = hasNetlifyEnv ? netlifyEnv.get(name) : undefined;
  if (typeof netlifyValue === 'string') return netlifyValue;

  // Netlify CLI local dev currently runs Edge Functions in a Deno-like shim.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const denoEnv = (globalThis as any)?.Deno?.env;
  const hasDenoEnv = typeof denoEnv?.get === 'function';
  const denoValue = hasDenoEnv ? denoEnv.get(name) : undefined;
  if (typeof denoValue === 'string') return denoValue;

  // If neither Netlify.env nor Deno.env is available, this runtime cannot
  // access environment variables at all. Fail explicitly rather than
  // silently returning undefined, since required secrets (e.g.
  // EMPLOYER_SESSION_SECRET) would be missing.
  if (!hasNetlifyEnv && !hasDenoEnv) {
    // Use console.error for visibility in logs without introducing
    // any additional dependencies.
    console.error(
      `Environment access is not available in this runtime; ` +
        `missing variable "${name}". Ensure this function runs ` +
        `in a supported Netlify Edge or Deno-like environment.`
    );
    throw new Error(
      `Environment variables are not accessible in this runtime (missing "${name}")`
    );
  }
  return undefined;
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecodeToBytes(input: string): Uint8Array {
  const padded = input
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(input.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [rawName, ...rawValueParts] = part.trim().split('=');
    if (!rawName) continue;
    const name = rawName.trim();
    const value = rawValueParts.length > 0 ? rawValueParts.join('=') : '';
    out[name] = value;
  }
  return out;
}

function getAllowedOrigins(): Set<string> {
  const raw = getEnv('EMPLOYER_ALLOWED_ORIGINS') ?? '';
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

function corsHeadersForRequest(request: Request): {
  headers: Headers;
  allowed: boolean;
} {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');

  const origin = request.headers.get('Origin');
  if (!origin) {
    // Require an explicit Origin header so that all requests are subject to the
    // EMPLOYER_ALLOWED_ORIGINS allow-list. Non-browser clients must send Origin
    // explicitly if they need CORS access.
    return { headers, allowed: false };
  }

  const allowedOrigins = getAllowedOrigins();
  if (!allowedOrigins.has(origin)) {
    return { headers, allowed: false };
  }

  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Vary', 'Origin');
  return { headers, allowed: true };
}

async function getHmacKey(): Promise<CryptoKey> {
  const secret = getEnv('EMPLOYER_SESSION_SECRET') ?? '';
  if (!secret) {
    throw new Error('Missing EMPLOYER_SESSION_SECRET');
  }

  if (cachedKey && cachedSecret === secret) return cachedKey;

  const enc = new TextEncoder();
  cachedSecret = secret;
  cachedKey = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  return cachedKey;
}

async function signString(data: string): Promise<Uint8Array> {
  const key = await getHmacKey();
  const enc = new TextEncoder();
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return new Uint8Array(sig);
}

async function makeSessionToken(nowSeconds: number): Promise<string> {
  const payload: AuthPayload = {
    iat: nowSeconds,
    exp: nowSeconds + SESSION_SECONDS,
  };
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncodeBytes(new TextEncoder().encode(payloadJson));
  const sig = await signString(payloadB64);
  const sigB64 = base64UrlEncodeBytes(sig);
  return `${payloadB64}.${sigB64}`;
}

async function verifySessionToken(token: string, nowSeconds: number): Promise<boolean> {
  const [payloadB64, sigB64, ...rest] = token.split('.');
  if (!payloadB64 || !sigB64 || rest.length > 0) return false;

  let payload: AuthPayload;
  try {
    const payloadJson = new TextDecoder().decode(base64UrlDecodeToBytes(payloadB64));
    payload = JSON.parse(payloadJson) as AuthPayload;
  } catch {
    return false;
  }

  if (!payload || typeof payload.exp !== 'number' || typeof payload.iat !== 'number') return false;
  if (payload.exp <= nowSeconds) return false;

  const expectedSig = await signString(payloadB64);
  let providedSig: Uint8Array;
  try {
    providedSig = base64UrlDecodeToBytes(sigB64);
  } catch {
    return false;
  }

  return timingSafeEqual(expectedSig, providedSig);
}

function jsonResponse(body: unknown, init: { status: number; headers: Headers }): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(body), { status: init.status, headers });
}

export default async (request: Request) => {
  const cors = corsHeadersForRequest(request);

  // Handle preflight
  if (request.method === 'OPTIONS') {
    if (!cors.allowed) {
      return jsonResponse({ error: 'Origin not allowed' }, { status: 403, headers: cors.headers });
    }
    return new Response(null, { status: 204, headers: cors.headers });
  }

  if (!cors.allowed) {
    return jsonResponse({ error: 'Origin not allowed' }, { status: 403, headers: cors.headers });
  }

  const nowSeconds = Math.floor(Date.now() / 1000);

  try {
    const cookies = parseCookies(request.headers.get('Cookie'));
    const token = cookies[COOKIE_NAME];
    const hasValidSession = token ? await verifySessionToken(token, nowSeconds) : false;

    if (request.method === 'GET') {
      return jsonResponse({ authorized: hasValidSession }, { status: 200, headers: cors.headers });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, { status: 405, headers: cors.headers });
    }

    // If already authorized, don't require password again.
    if (hasValidSession) {
      return jsonResponse({ success: true, authorized: true }, { status: 200, headers: cors.headers });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, { status: 400, headers: cors.headers });
    }

    const password = (body as { password?: unknown })?.password;
    if (typeof password !== 'string') {
      return jsonResponse({ error: 'Password required' }, { status: 400, headers: cors.headers });
    }

    const expectedPassword = getEnv('EMPLOYER_PASSWORD');
    if (!expectedPassword || password !== expectedPassword) {
      return jsonResponse({ error: 'Invalid password' }, { status: 401, headers: cors.headers });
    }

    const sessionToken = await makeSessionToken(nowSeconds);
    const headers = new Headers(cors.headers);
    const isHttps = new URL(request.url).protocol === 'https:';
    headers.append(
      'Set-Cookie',
      `${COOKIE_NAME}=${sessionToken}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; SameSite=Strict${isHttps ? '; Secure' : ''}`
    );

    return jsonResponse({ success: true, authorized: true, message: 'Access granted' }, { status: 200, headers });
  } catch (error) {
    console.error('Error in employer-auth:', error);
    return jsonResponse({ error: 'Server error' }, { status: 500, headers: cors.headers });
  }
};
