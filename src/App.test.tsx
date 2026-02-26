/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App';

vi.mock('./components/layout', () => ({
  Layout: () => <div>Mock Layout</div>,
}));

vi.mock('./components/password-gate', () => ({
  PasswordGate: ({ onAuthorize }: { onAuthorize: () => void }) => (
    <div>
      <div>Mock PasswordGate</div>
      <button onClick={onAuthorize}>Authorize</button>
    </div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('App', () => {
  it('shows a loading status while checking session', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => undefined)) as unknown as typeof fetch);

    render(<App />);

    expect(screen.getByRole('status').textContent).toContain('Checking session');
  });

  it('renders Layout when /auth/employer returns authorized=true', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        json: async () => ({ authorized: true }),
      })) as unknown as typeof fetch
    );

    render(<App />);

    expect(await screen.findByText('Mock Layout')).toBeTruthy();
  });

  it('renders PasswordGate when unauthorized, then Layout after onAuthorize', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        json: async () => ({ authorized: false }),
      })) as unknown as typeof fetch
    );

    render(<App />);

    expect(await screen.findByText('Mock PasswordGate')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Authorize' }));
    expect(await screen.findByText('Mock Layout')).toBeTruthy();
  });

  it('treats fetch errors as unauthorized', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('boom'))) as unknown as typeof fetch
    );

    render(<App />);

    expect(await screen.findByText('Mock PasswordGate')).toBeTruthy();
  });
});
