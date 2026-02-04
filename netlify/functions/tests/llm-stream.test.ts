import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { makeRequest } from '../../tests/test-utils';

const ALLOWED_ORIGIN = 'https://allowed.example';

// ---- Mocks (must be defined before importing handler) ----
const streamTextMock = vi.fn();
vi.mock('ai', () => ({
  streamText: streamTextMock,
}));

const groqMock = vi.fn((modelId: string) => ({ __provider: 'groq', modelId }));
vi.mock('@ai-sdk/groq', () => ({
  groq: groqMock,
}));

const googleModelFactoryMock = vi.fn((modelId: string) => ({ __provider: 'google', modelId }));
const createGoogleGenerativeAIMock = vi.fn(() => googleModelFactoryMock);
vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: createGoogleGenerativeAIMock,
}));

type Env = Record<string, string | undefined>;

function installEnv(env: Env) {
  // Keep the environment small and deterministic.
  process.env.EMPLOYER_SESSION_SECRET = env.EMPLOYER_SESSION_SECRET;
  process.env.LLM_ALLOWED_ORIGINS = env.LLM_ALLOWED_ORIGINS;
  process.env.EMPLOYER_ALLOWED_ORIGINS = env.EMPLOYER_ALLOWED_ORIGINS;
  process.env.GOOGLE_MODEL_ID = env.GOOGLE_MODEL_ID;
  process.env.GROQ_MODEL_ID = env.GROQ_MODEL_ID;
}

function mintSessionToken(params: {
  secret: string;
  iatSeconds: number;
  expSeconds: number;
}): string {
  const payloadB64 = Buffer.from(
    JSON.stringify({ iat: params.iatSeconds, exp: params.expSeconds }),
    'utf8'
  ).toString('base64');
  const sigB64 = createHmac('sha256', params.secret).update(payloadB64, 'utf8').digest('base64');
  return `${payloadB64}.${sigB64}`;
}

async function readSseText(res: Response): Promise<string> {
  // SSE error responses are streamed; .text() will consume the body.
  return await res.text();
}

function expectSseErrorPayload(text: string, errorText: string) {
  expect(text).toContain(`data:${JSON.stringify({ type: 'error', errorText })}\n\n`);
  expect(text).toContain('data:[DONE]\n\n');
}

async function loadHandler() {
  // Ensure module-level state (rate-limit buckets) does not leak between tests.
  vi.resetModules();
  const mod = await import('../llm-stream');
  return mod.default as (req: Request, context: unknown) => Promise<Response>;
}

beforeEach(() => {
  installEnv({
    EMPLOYER_SESSION_SECRET: 'test-secret',
    LLM_ALLOWED_ORIGINS: ALLOWED_ORIGIN,
    GOOGLE_MODEL_ID: 'gemini-test',
    GROQ_MODEL_ID: 'llama-test',
  });

  streamTextMock.mockReset();
  groqMock.mockClear();
  googleModelFactoryMock.mockClear();
  createGoogleGenerativeAIMock.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('netlify function llm-stream', () => {
  function makeValidToken(nowMs: number, secret = 'test-secret'): string {
    const iatSeconds = Math.floor(nowMs / 1000);
    return mintSessionToken({ secret, iatSeconds, expSeconds: iatSeconds + 60 });
  }

  it('blocks when Origin header is missing (403 SSE error)', async () => {
    const handler = await loadHandler();
    const res = await handler(makeRequest({ method: 'GET' }), {});
    expect(res.status).toBe(403);
    expect(res.headers.get('x-vercel-ai-ui-message-stream')).toBe('v1');
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    expectSseErrorPayload(await readSseText(res), 'Missing Origin');
  });

  it('blocks when Origin is not allowed (403 SSE error)', async () => {
    const handler = await loadHandler();
    const res = await handler(
      makeRequest({
        method: 'POST',
        origin: 'https://evil.example',
        jsonBody: { provider: 'groq', prompt: 'hi' },
      }),
      {}
    );
    expect(res.status).toBe(403);
    expectSseErrorPayload(await readSseText(res), 'Origin not allowed');
  });

  it('returns 204 for allowed CORS preflight OPTIONS', async () => {
    const handler = await loadHandler();
    const res = await handler(makeRequest({ method: 'OPTIONS', origin: ALLOWED_ORIGIN }), {});
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe(ALLOWED_ORIGIN);
    expect(res.headers.get('access-control-allow-credentials')).toBe('true');
    expect(res.headers.get('access-control-allow-methods')).toContain('POST');
    expect(res.headers.get('access-control-allow-methods')).toContain('OPTIONS');
    expect(res.headers.get('access-control-allow-headers')).toBe('content-type');
    expect(res.headers.get('x-vercel-ai-ui-message-stream')).toBe('v1');
  });

  it('rejects non-POST methods (405 SSE error) and includes CORS headers', async () => {
    const handler = await loadHandler();
    const res = await handler(makeRequest({ method: 'GET', origin: ALLOWED_ORIGIN }), {});
    expect(res.status).toBe(405);
    expect(res.headers.get('access-control-allow-origin')).toBe(ALLOWED_ORIGIN);
    expect(res.headers.get('access-control-allow-credentials')).toBe('true');
    expect(res.headers.get('vary')).toBe('Origin');
    expectSseErrorPayload(await readSseText(res), 'Method not allowed');
  });

  it('requires Content-Type application/json (415 SSE error)', async () => {
    const handler = await loadHandler();

    const token = makeValidToken(Date.now());

    const res = await handler(
      makeRequest({
        method: 'POST',
        origin: ALLOWED_ORIGIN,
        cookie: `pf_employer_session=${token}`,
        rawBody: 'hello',
        contentType: 'text/plain',
      }),
      {}
    );
    expect(res.status).toBe(415);
    expectSseErrorPayload(await readSseText(res), 'Content-Type must be application/json');
  });

  it('requires a valid session cookie (401 SSE error)', async () => {
    const handler = await loadHandler();
    const res = await handler(
      makeRequest({
        method: 'POST',
        origin: ALLOWED_ORIGIN,
        jsonBody: { provider: 'groq', prompt: 'hi' },
      }),
      {}
    );
    expect(res.status).toBe(401);
    expect(res.headers.get('access-control-allow-origin')).toBe(ALLOWED_ORIGIN);
    expectSseErrorPayload(await readSseText(res), 'Unauthorized');
  });

  it('rejects a tampered session token (401 SSE error)', async () => {
    const handler = await loadHandler();

    const token = makeValidToken(Date.now());
    const [payloadB64, sigB64] = token.split('.');
    expect(payloadB64).toBeTruthy();
    expect(sigB64).toBeTruthy();
    const tamperedPayloadB64 =
      payloadB64!.slice(0, -1) + (payloadB64!.slice(-1) === 'A' ? 'B' : 'A');
    const tampered = `${tamperedPayloadB64}.${sigB64}`;

    const res = await handler(
      makeRequest({
        method: 'POST',
        origin: ALLOWED_ORIGIN,
        cookie: `pf_employer_session=${tampered}`,
        jsonBody: { provider: 'groq', prompt: 'hi' },
      }),
      {}
    );
    expect(res.status).toBe(401);
    expectSseErrorPayload(await readSseText(res), 'Unauthorized');
  });

  it('rejects an expired session token (401 SSE error)', async () => {
    const handler = await loadHandler();

    const t0 = 1_700_000_000_000;
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(t0);
    const token = makeValidToken(t0);
    nowSpy.mockReturnValue(t0 + 120_000);

    const res = await handler(
      makeRequest({
        method: 'POST',
        origin: ALLOWED_ORIGIN,
        cookie: `pf_employer_session=${token}`,
        jsonBody: { provider: 'groq', prompt: 'hi' },
      }),
      {}
    );
    expect(res.status).toBe(401);
    expectSseErrorPayload(await readSseText(res), 'Unauthorized');
  });

  it('rate limits requests per token + IP (429, retry-after)', async () => {
    const handler = await loadHandler();

    const t0 = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(t0);
    const token = makeValidToken(t0);

    // Use invalid JSON so calls are cheap; rate-limit happens before JSON parsing.
    for (let i = 0; i < 30; i++) {
      const res = await handler(
        makeRequest({
          method: 'POST',
          origin: ALLOWED_ORIGIN,
          cookie: `pf_employer_session=${token}`,
          rawBody: '{not json',
          contentType: 'application/json',
        }),
        { ip: '1.2.3.4' }
      );
      expect(res.status).not.toBe(429);
      await res.text();
    }

    const limited = await handler(
      makeRequest({
        method: 'POST',
        origin: ALLOWED_ORIGIN,
        cookie: `pf_employer_session=${token}`,
        rawBody: '{not json',
        contentType: 'application/json',
      }),
      { ip: '1.2.3.4' }
    );
    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toBeTruthy();
    expectSseErrorPayload(await readSseText(limited), 'Rate limit exceeded');
  });

  it('returns 400 for invalid JSON body', async () => {
    const handler = await loadHandler();
    const token = makeValidToken(Date.now());

    const res = await handler(
      makeRequest({
        method: 'POST',
        origin: ALLOWED_ORIGIN,
        cookie: `pf_employer_session=${token}`,
        rawBody: '{not json',
        contentType: 'application/json',
      }),
      { ip: '5.6.7.8' }
    );
    expect(res.status).toBe(400);
    expectSseErrorPayload(await readSseText(res), 'Invalid JSON');
  });

  it.each([
    {
      name: 'provider must be groq or google',
      body: { provider: 'openai', prompt: 'hi' },
      status: 400,
      errorText: 'provider must be "groq" or "google"',
    },
    {
      name: 'prompt must be a string',
      body: { provider: 'groq', prompt: 123 },
      status: 400,
      errorText: 'prompt must be a string',
    },
    {
      name: 'prompt must not be empty',
      body: { provider: 'groq', prompt: '   ' },
      status: 400,
      errorText: 'prompt must not be empty',
    },
    {
      name: 'prompt max length enforced',
      body: { provider: 'groq', prompt: 'a'.repeat(4001) },
      status: 413,
      errorText: 'prompt too long (max 4000 chars)',
    },
  ])('$name', async ({ body, status, errorText }) => {
    const handler = await loadHandler();
    const token = makeValidToken(Date.now());

    const res = await handler(
      makeRequest({
        method: 'POST',
        origin: ALLOWED_ORIGIN,
        cookie: `pf_employer_session=${token}`,
        jsonBody: body,
      }),
      { ip: '9.9.9.9' }
    );
    expect(res.status).toBe(status);
    expectSseErrorPayload(await readSseText(res), errorText);
  });

  it('validates google modelId type (400)', async () => {
    const handler = await loadHandler();
    const token = makeValidToken(Date.now());

    const res = await handler(
      makeRequest({
        method: 'POST',
        origin: ALLOWED_ORIGIN,
        cookie: `pf_employer_session=${token}`,
        jsonBody: { provider: 'google', prompt: 'hi', modelId: 123 },
      }),
      { ip: '8.8.8.8' }
    );
    expect(res.status).toBe(400);
    expectSseErrorPayload(await readSseText(res), 'modelId must be a string');
  });

  it('rejects unsupported google modelId (400)', async () => {
    const handler = await loadHandler();
    const token = makeValidToken(Date.now());

    const res = await handler(
      makeRequest({
        method: 'POST',
        origin: ALLOWED_ORIGIN,
        cookie: `pf_employer_session=${token}`,
        jsonBody: { provider: 'google', prompt: 'hi', modelId: 'nope' },
      }),
      { ip: '8.8.4.4' }
    );
    expect(res.status).toBe(400);
    expectSseErrorPayload(
      await readSseText(res),
      'Unsupported modelId. Allowed: gemini-test, gemini-2.5-flash-lite'
    );
  });

  it('returns a UI message stream response (mocked) and trims prompt', async () => {
    const handler = await loadHandler();
    const token = makeValidToken(Date.now());

    const toUIMessageStreamResponse = vi.fn((opts: unknown) => {
      // The handler should provide CORS + anti-buffering headers to the AI SDK response.
      const { headers, messageMetadata } = opts as {
        headers: Record<string, string>;
        messageMetadata: (args: { part: unknown }) => unknown;
      };
      expect(headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
      expect(headers['access-control-allow-credentials']).toBe('true');
      expect(headers.vary).toBe('Origin');
      expect(headers['Content-Encoding']).toBe('none');
      expect(headers['Cache-Control']).toBe('no-store');

      const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(123);
      const startMeta = messageMetadata({ part: { type: 'start' } });
      expect(startMeta).toMatchObject({ provider: 'groq', modelId: 'llama-test', startedAt: 123 });

      const finishMeta = messageMetadata({
        part: { type: 'finish', totalUsage: { totalTokens: 6, inputTokens: 2, outputTokens: 4 } },
      });
      expect(finishMeta).toMatchObject({
        provider: 'groq',
        modelId: 'llama-test',
        finishedAt: 123,
        totalTokens: 6,
        inputTokens: 2,
        outputTokens: 4,
      });
      nowSpy.mockRestore();

      return new Response('ok', { status: 200, headers: new Headers({ 'x-test': '1' }) });
    });

    streamTextMock.mockReturnValue({ toUIMessageStreamResponse });

    const res = await handler(
      makeRequest({
        method: 'POST',
        origin: ALLOWED_ORIGIN,
        cookie: `pf_employer_session=${token}`,
        jsonBody: { provider: 'groq', prompt: '   hello   ' },
      }),
      { ip: '7.7.7.7' }
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('x-test')).toBe('1');
    expect(await res.text()).toBe('ok');

    expect(groqMock).toHaveBeenCalledWith('llama-test');
    expect(streamTextMock).toHaveBeenCalledTimes(1);
    expect(streamTextMock.mock.calls[0]?.[0]).toMatchObject({
      prompt: 'hello',
      model: { __provider: 'groq', modelId: 'llama-test' },
    });
    expect(toUIMessageStreamResponse).toHaveBeenCalledTimes(1);
  });

  it('returns 502 SSE error when upstream streaming throws (sanitized message)', async () => {
    const handler = await loadHandler();
    const token = makeValidToken(Date.now());
    vi.spyOn(console, 'error').mockImplementation(() => {});

    streamTextMock.mockImplementation(() => {
      throw new Error('boom');
    });

    const res = await handler(
      makeRequest({
        method: 'POST',
        origin: ALLOWED_ORIGIN,
        cookie: `pf_employer_session=${token}`,
        jsonBody: { provider: 'groq', prompt: 'hi' },
      }),
      { ip: '6.6.6.6' }
    );
    expect(res.status).toBe(502);
    expect(res.headers.get('access-control-allow-origin')).toBe(ALLOWED_ORIGIN);
    expectSseErrorPayload(await readSseText(res), 'boom');
  });

  it('truncates very long upstream error messages', async () => {
    const handler = await loadHandler();
    const token = makeValidToken(Date.now());
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const long = 'x'.repeat(1300);
    const expected = `${'x'.repeat(1200)}…`;
    streamTextMock.mockImplementation(() => {
      throw new Error(long);
    });

    const res = await handler(
      makeRequest({
        method: 'POST',
        origin: ALLOWED_ORIGIN,
        cookie: `pf_employer_session=${token}`,
        jsonBody: { provider: 'google', prompt: 'hi' },
      }),
      { ip: '6.6.6.7' }
    );
    expect(res.status).toBe(502);
    expectSseErrorPayload(await readSseText(res), expected);
  });
});
