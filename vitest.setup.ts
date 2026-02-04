import { webcrypto } from 'node:crypto';

// Ensure WebCrypto is available for Edge-function code under test (HMAC signing).
if (!globalThis.crypto?.subtle) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).crypto = webcrypto as any;
}

// Netlify Edge runtime provides atob/btoa. Node may not, depending on version.
if (!globalThis.atob) {
  // atob decodes base64 into a "binary string" (latin1)
  globalThis.atob = (input: string) => Buffer.from(input, 'base64').toString('binary');
}

if (!globalThis.btoa) {
  // btoa encodes a "binary string" (latin1) into base64
  globalThis.btoa = (input: string) => Buffer.from(input, 'binary').toString('base64');
}
