export type MakeRequestOptions = {
  method: string;
  url?: string;
  origin?: string;
  cookie?: string;
  jsonBody?: unknown;
  rawBody?: string;
  contentType?: string;
  headers?: Record<string, string>;
};

export function makeRequest(opts: MakeRequestOptions): Request {
  const url = opts.url ?? 'https://app.example/test';
  const headers = new Headers(opts.headers ?? {});
  if (opts.origin) headers.set('Origin', opts.origin);
  if (opts.cookie) headers.set('Cookie', opts.cookie);

  let body: BodyInit | undefined;
  if (opts.rawBody !== undefined) {
    body = opts.rawBody;
    headers.set('Content-Type', opts.contentType ?? 'application/json');
  } else if (opts.jsonBody !== undefined) {
    body = JSON.stringify(opts.jsonBody);
    headers.set('Content-Type', opts.contentType ?? 'application/json');
  } else if (opts.contentType) {
    headers.set('Content-Type', opts.contentType);
  }

  return new Request(url, { method: opts.method, headers, body });
}
