import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createHmac, timingSafeEqual as nodeTimingSafeEqual } from 'node:crypto';

// Netlify Function (Node runtime, Request->Response)
// Streaming endpoint that returns AI SDK UI Message Stream (SSE).
//
// - Requires gate cookie `pf_employer_session` and verifies it server-side (HMAC-SHA256)
// - Requires Origin allowlist
// - Validates request shape and limits prompt length
// - Best-effort in-memory rate limiting (per session + IP)
// - Sanitized errors/logging (no prompt logging)

const COOKIE_NAME = 'pf_employer_session';

// Google Generative AI provider defaults to the v1beta REST API. Some accounts / model
// ids may require the stable v1 endpoint. See @ai-sdk/google docs: baseURL option.
const google = createGoogleGenerativeAI({
  baseURL: 'https://generativelanguage.googleapis.com/v1',
});

const PROMPT_MAX_CHARS = 4000;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX_REQUESTS = 30; // per window
const GOOGLE_MODEL_ID = process.env.GOOGLE_MODEL_ID ?? 'gemini-2.5-flash';
const GROQ_MODEL_ID = process.env.GROQ_MODEL_ID ?? 'llama-3.1-8b-instant';
const GOOGLE_FLASH_LITE_MODEL_ID = 'gemini-2.5-flash-lite';

type SessionPayload = { exp: number; iat: number };

function base64UrlDecodeToBytes(input: string): Buffer {
  return Buffer.from(input, 'base64');
}

function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  try {
    return nodeTimingSafeEqual(a, b);
  } catch {
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
  }
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

  const expected = createHmac('sha256', secret).update(payloadB64, 'utf8').digest();

  let provided: Buffer;
  try {
    provided = base64UrlDecodeToBytes(sigB64);
  } catch {
    return false;
  }

  return timingSafeEqual(expected, provided);
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

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rawValueParts] = part.trim().split('=');
    if (!rawName) continue;
    out[rawName] = rawValueParts.length ? rawValueParts.join('=') : '';
  }
  return out;
}

function getClientIp(req: Request, context: unknown): string {
  const ctx = context as { ip?: unknown } | null;
  if (typeof ctx?.ip === 'string' && ctx.ip.trim()) return ctx.ip.trim();
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || 'unknown';
  const nfIp = req.headers.get('x-nf-client-connection-ip');
  if (nfIp) return nfIp.trim();
  return 'unknown';
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
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAtMs - now) / 1000)),
    };
  }
  bucket.count += 1;
  return { allowed: true };
}

function sseHeaders(extra?: Record<string, string>): Headers {
  const h = new Headers({
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-store',
    // Some proxy setups buffer/compress streams; explicitly disabling can help.
    // (AI SDK docs: "streaming not working when proxied")
    'content-encoding': 'none',
    // Required for the AI SDK UI data stream protocol.
    'x-vercel-ai-ui-message-stream': 'v1',
    ...(extra ?? {}),
  });
  return h;
}

function sseErrorResponse(
  status: number,
  errorText: string,
  extraHeaders?: Record<string, string>
) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const payload = JSON.stringify({ type: 'error', errorText });
      controller.enqueue(encoder.encode(`data:${payload}\n\n`));
      controller.enqueue(encoder.encode(`data:[DONE]\n\n`));
      controller.close();
    },
  });
  return new Response(body, { status, headers: sseHeaders(extraHeaders) });
}

function safeUpstreamErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const trimmed = raw.trim();
  if (!trimmed) return 'LLM request failed';
  return trimmed.length > 1200 ? `${trimmed.slice(0, 1200)}…` : trimmed;
}

export default async function handler(req: Request, context: unknown): Promise<Response> {
  const origin = req.headers.get('origin');
  if (!origin) return sseErrorResponse(403, 'Missing Origin');
  const allowed = getAllowedOrigins();
  if (!allowed.has(origin)) return sseErrorResponse(403, 'Origin not allowed');

  const corsHeaders = {
    'access-control-allow-origin': origin,
    'access-control-allow-credentials': 'true',
    vary: 'Origin',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: sseHeaders({
        ...corsHeaders,
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
        'access-control-max-age': '86400',
      }),
    });
  }

  if (req.method !== 'POST') return sseErrorResponse(405, 'Method not allowed', corsHeaders);

  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return sseErrorResponse(415, 'Content-Type must be application/json', corsHeaders);
  }

  // Require gate cookie and verify token
  const cookies = parseCookies(req.headers.get('cookie'));
  const token = cookies[COOKIE_NAME];
  if (!token || !verifySessionToken(token)) {
    return sseErrorResponse(401, 'Unauthorized', corsHeaders);
  }

  // Best-effort rate limiting
  const ip = getClientIp(req, context);
  const rateKey = `${token}.${ip}`;
  const rl = rateLimit(rateKey);
  if (!rl.allowed) {
    return sseErrorResponse(429, 'Rate limit exceeded', {
      ...corsHeaders,
      'retry-after': String(rl.retryAfterSeconds),
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return sseErrorResponse(400, 'Invalid JSON', corsHeaders);
  }

  const provider = (body as { provider?: unknown }).provider;
  const prompt = (body as { prompt?: unknown }).prompt;
  const requestedModelId = (body as { modelId?: unknown }).modelId;

  if (provider !== 'groq' && provider !== 'google') {
    return sseErrorResponse(400, 'provider must be "groq" or "google"', corsHeaders);
  }
  if (typeof prompt !== 'string') {
    return sseErrorResponse(400, 'prompt must be a string', corsHeaders);
  }

  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt) return sseErrorResponse(400, 'prompt must not be empty', corsHeaders);
  if (trimmedPrompt.length > PROMPT_MAX_CHARS) {
    return sseErrorResponse(413, `prompt too long (max ${PROMPT_MAX_CHARS} chars)`, corsHeaders);
  }

  try {
    let modelId = provider === 'groq' ? GROQ_MODEL_ID : GOOGLE_MODEL_ID;

    if (provider === 'google' && requestedModelId != null) {
      if (typeof requestedModelId !== 'string') {
        return sseErrorResponse(400, 'modelId must be a string', corsHeaders);
      }
      const allowed = new Set([GOOGLE_MODEL_ID, GOOGLE_FLASH_LITE_MODEL_ID]);
      if (!allowed.has(requestedModelId)) {
        return sseErrorResponse(
          400,
          `Unsupported modelId. Allowed: ${[...allowed].join(', ')}`,
          corsHeaders
        );
      }
      modelId = requestedModelId;
    }

    const model = provider === 'groq' ? groq(modelId) : google(modelId);

    const result = streamText({
      model,
      prompt: trimmedPrompt,
    });

    return result.toUIMessageStreamResponse({
      headers: {
        ...corsHeaders,
        // Prevent buffering/compression issues in some proxy environments.
        'Content-Encoding': 'none',
        'Cache-Control': 'no-store',
      },
      // Attach usage and provenance as message-level metadata.
      messageMetadata: ({ part }) => {
        if (part.type === 'start') {
          return {
            provider,
            modelId,
            startedAt: Date.now(),
          };
        }
        if (part.type === 'finish') {
          return {
            provider,
            modelId,
            finishedAt: Date.now(),
            totalTokens: part.totalUsage.totalTokens,
            inputTokens: part.totalUsage.inputTokens,
            outputTokens: part.totalUsage.outputTokens,
          };
        }
      },
    });
  } catch (err) {
    const message = safeUpstreamErrorMessage(err);
    console.error('llm-stream function error', { message });
    return sseErrorResponse(502, message, corsHeaders);
  }
}
