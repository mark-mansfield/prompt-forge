import { describe, it, expect, beforeEach, vi } from 'vitest';
import handler from '../employer-auth';

const ALLOWED_ORIGIN = 'https://allowed.example';

type Env = Record<string, string | undefined>;

type NetlifyGlobal = typeof globalThis & {
  Netlify?: {
    env: {
      get(name: string): string | undefined;
    };
  };
};

function installNetlifyEnv(env: Env) {
  const g = globalThis as unknown as NetlifyGlobal;
  g.Netlify = {
    env: {
      get: (name: string) => env[name],
    },
  };
}

async function readJson<T = unknown>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

function makeRequest(opts: {
  method: string;
  url?: string;
  origin?: string;
  cookie?: string;
  jsonBody?: unknown;
  rawBody?: string;
  contentType?: string;
}): Request {
  const url = opts.url ?? 'https://app.example/auth/employer';
  const headers = new Headers();
  if (opts.origin) headers.set('Origin', opts.origin);
  if (opts.cookie) headers.set('Cookie', opts.cookie);

  let body: BodyInit | undefined;
  if (opts.rawBody !== undefined) {
    body = opts.rawBody;
    headers.set('Content-Type', opts.contentType ?? 'application/json');
  } else if (opts.jsonBody !== undefined) {
    body = JSON.stringify(opts.jsonBody);
    headers.set('Content-Type', 'application/json');
  }

  return new Request(url, { method: opts.method, headers, body });
}

function extractCookieValue(setCookie: string, name: string): string | null {
  // Example: "pf_employer_session=AAA.BBB; Path=/; Max-Age=86400; HttpOnly; SameSite=Strict; Secure"
  const prefix = `${name}=`;
  if (!setCookie.startsWith(prefix)) return null;
  const rest = setCookie.slice(prefix.length);
  const value = rest.split(';', 1)[0];
  return value ?? null;
}

describe('netlify edge function employer-auth', () => {
  beforeEach(() => {
    installNetlifyEnv({
      EMPLOYER_SESSION_SECRET: 'test-session-secret',
      EMPLOYER_PASSWORD: 'correct-password',
      EMPLOYER_ALLOWED_ORIGINS: ALLOWED_ORIGIN,
    });
  });

  it('returns 204 for allowed CORS preflight OPTIONS', async () => {
    const req = makeRequest({ method: 'OPTIONS', origin: ALLOWED_ORIGIN });
    const res = await handler(req);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('OPTIONS');
  });

  it('blocks preflight OPTIONS for disallowed origin', async () => {
    const req = makeRequest({ method: 'OPTIONS', origin: 'https://evil.example' });
    const res = await handler(req);
    expect(res.status).toBe(403);
    const body = await readJson(res);
    expect(body).toEqual({ error: 'Origin not allowed' });
  });

  it('blocks GET for disallowed origin', async () => {
    const req = makeRequest({ method: 'GET', origin: 'https://evil.example' });
    const res = await handler(req);
    expect(res.status).toBe(403);
    const body = await readJson(res);
    expect(body).toEqual({ error: 'Origin not allowed' });
  });

  it('allows GET without Origin only on localhost', async () => {
    const localhostReq = makeRequest({ method: 'GET', url: 'http://localhost/auth/employer' });
    const localhostRes = await handler(localhostReq);
    expect(localhostRes.status).toBe(200);
    expect(await readJson(localhostRes)).toEqual({ authorized: false });

    const prodReq = makeRequest({ method: 'GET', url: 'https://app.example/auth/employer' });
    const prodRes = await handler(prodReq);
    expect(prodRes.status).toBe(403);
  });

  it('GET returns authorized false when no cookie present', async () => {
    const req = makeRequest({ method: 'GET', origin: ALLOWED_ORIGIN });
    const res = await handler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED_ORIGIN);
    expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    expect(await readJson(res)).toEqual({ authorized: false });
  });

  it('POST rejects invalid JSON', async () => {
    const req = makeRequest({ method: 'POST', origin: ALLOWED_ORIGIN, rawBody: '{not json' });
    const res = await handler(req);
    expect(res.status).toBe(400);
    expect(await readJson(res)).toEqual({ error: 'Invalid JSON' });
  });

  it('POST requires password', async () => {
    const req = makeRequest({ method: 'POST', origin: ALLOWED_ORIGIN, jsonBody: {} });
    const res = await handler(req);
    expect(res.status).toBe(400);
    expect(await readJson(res)).toEqual({ error: 'Password required' });
  });

  it('POST rejects wrong password', async () => {
    const req = makeRequest({
      method: 'POST',
      origin: ALLOWED_ORIGIN,
      jsonBody: { password: 'wrong-password' },
    });
    const res = await handler(req);
    expect(res.status).toBe(401);
    expect(await readJson(res)).toEqual({ error: 'Invalid password' });
  });

  it('POST success sets cookie and GET verifies it (authorized true)', async () => {
    const postReq = makeRequest({
      method: 'POST',
      origin: ALLOWED_ORIGIN,
      jsonBody: { password: 'correct-password' },
      url: 'https://app.example/auth/employer',
    });
    const postRes = await handler(postReq);
    expect(postRes.status).toBe(200);

    const setCookie = postRes.headers.get('Set-Cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain('pf_employer_session=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Strict');
    expect(setCookie).toContain('Max-Age=');
    expect(setCookie).toContain('Secure');

    const token = extractCookieValue(setCookie!, 'pf_employer_session');
    expect(token).toBeTruthy();

    const getReq = makeRequest({
      method: 'GET',
      origin: ALLOWED_ORIGIN,
      cookie: `pf_employer_session=${token}`,
    });
    const getRes = await handler(getReq);
    expect(getRes.status).toBe(200);
    expect(await readJson(getRes)).toEqual({ authorized: true });
  });

  it('does not set Secure flag for http URLs', async () => {
    const req = makeRequest({
      method: 'POST',
      origin: ALLOWED_ORIGIN,
      jsonBody: { password: 'correct-password' },
      url: 'http://localhost/auth/employer',
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    const setCookie = res.headers.get('Set-Cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).not.toContain('Secure');
  });

  it('POST succeeds without password if already authorized (valid cookie)', async () => {
    const loginRes = await handler(
      makeRequest({
        method: 'POST',
        origin: ALLOWED_ORIGIN,
        jsonBody: { password: 'correct-password' },
      })
    );
    const setCookie = loginRes.headers.get('Set-Cookie');
    const token = extractCookieValue(setCookie!, 'pf_employer_session');

    const res = await handler(
      makeRequest({
        method: 'POST',
        origin: ALLOWED_ORIGIN,
        cookie: `pf_employer_session=${token}`,
        // no body
      })
    );
    expect(res.status).toBe(200);
    expect(await readJson(res)).toEqual({ success: true, authorized: true });
  });

  it('rejects a tampered token (signature mismatch)', async () => {
    const loginRes = await handler(
      makeRequest({
        method: 'POST',
        origin: ALLOWED_ORIGIN,
        jsonBody: { password: 'correct-password' },
      })
    );
    const setCookie = loginRes.headers.get('Set-Cookie');
    const token = extractCookieValue(setCookie!, 'pf_employer_session')!;
    const [payload, sig] = token.split('.');
    expect(payload).toBeTruthy();
    expect(sig).toBeTruthy();

    const tamperedPayload = payload!.slice(0, -1) + (payload!.slice(-1) === 'A' ? 'B' : 'A');
    const tampered = `${tamperedPayload}.${sig}`;

    const res = await handler(
      makeRequest({
        method: 'GET',
        origin: ALLOWED_ORIGIN,
        cookie: `pf_employer_session=${tampered}`,
      })
    );
    expect(res.status).toBe(200);
    expect(await readJson(res)).toEqual({ authorized: false });
  });

  it('rejects a token signed with a different secret', async () => {
    // Mint token with secret A
    installNetlifyEnv({
      EMPLOYER_SESSION_SECRET: 'secretA',
      EMPLOYER_PASSWORD: 'correct-password',
      EMPLOYER_ALLOWED_ORIGINS: ALLOWED_ORIGIN,
    });
    const loginRes = await handler(
      makeRequest({
        method: 'POST',
        origin: ALLOWED_ORIGIN,
        jsonBody: { password: 'correct-password' },
      })
    );
    const token = extractCookieValue(loginRes.headers.get('Set-Cookie')!, 'pf_employer_session')!;

    // Verify with secret B
    installNetlifyEnv({
      EMPLOYER_SESSION_SECRET: 'secretB',
      EMPLOYER_PASSWORD: 'correct-password',
      EMPLOYER_ALLOWED_ORIGINS: ALLOWED_ORIGIN,
    });
    const res = await handler(
      makeRequest({
        method: 'GET',
        origin: ALLOWED_ORIGIN,
        cookie: `pf_employer_session=${token}`,
      })
    );
    expect(res.status).toBe(200);
    expect(await readJson(res)).toEqual({ authorized: false });
  });

  it('rejects an expired token (via Date.now stubbing)', async () => {
    const t0 = 1_700_000_000_000; // ms
    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockImplementation(() => t0);

    const loginRes = await handler(
      makeRequest({
        method: 'POST',
        origin: ALLOWED_ORIGIN,
        jsonBody: { password: 'correct-password' },
      })
    );
    const token = extractCookieValue(loginRes.headers.get('Set-Cookie')!, 'pf_employer_session')!;

    // Advance beyond 24h + 1s
    nowSpy.mockImplementation(() => t0 + (60 * 60 * 24 + 1) * 1000);

    const res = await handler(
      makeRequest({
        method: 'GET',
        origin: ALLOWED_ORIGIN,
        cookie: `pf_employer_session=${token}`,
      })
    );
    expect(res.status).toBe(200);
    expect(await readJson(res)).toEqual({ authorized: false });

    nowSpy.mockRestore();
  });
});
