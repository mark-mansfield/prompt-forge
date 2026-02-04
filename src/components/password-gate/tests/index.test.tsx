/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PasswordGate } from '../';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('PasswordGate', () => {
  it('disables submit until a passcode is entered', () => {
    render(<PasswordGate onAuthorize={() => undefined} />);

    const submit = screen.getByRole('button', { name: 'Enter' }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    fireEvent.change(screen.getByPlaceholderText('Enter passcode'), {
      target: { value: 'secret' },
    });

    expect(submit.disabled).toBe(false);
  });

  it('toggles passcode visibility', () => {
    render(<PasswordGate onAuthorize={() => undefined} />);

    const input = screen.getByPlaceholderText('Enter passcode') as HTMLInputElement;
    const toggle = screen.getByRole('button', { name: 'Toggle password visibility' });

    expect(input.getAttribute('type')).toBe('password');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(toggle);
    expect(input.getAttribute('type')).toBe('text');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(toggle);
    expect(input.getAttribute('type')).toBe('password');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
  });

  it('POSTs to /auth/employer and calls onAuthorize on success', async () => {
    const onAuthorize = vi.fn();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
      })) as unknown as typeof fetch
    );

    render(<PasswordGate onAuthorize={onAuthorize} />);

    fireEvent.change(screen.getByPlaceholderText('Enter passcode'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enter' }));

    await waitFor(() => expect(onAuthorize).toHaveBeenCalledTimes(1));

    expect(globalThis.fetch).toHaveBeenCalledWith('/auth/employer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password: 'secret' }),
    });
  });

  it('shows server-provided error message when login fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ error: 'Nope' }),
      })) as unknown as typeof fetch
    );

    render(<PasswordGate onAuthorize={() => undefined} />);

    fireEvent.change(screen.getByPlaceholderText('Enter passcode'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enter' }));

    expect(await screen.findByText('Nope')).toBeTruthy();
  });

  it('falls back to generic error when response JSON is invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        json: async () => {
          throw new Error('bad json');
        },
      })) as unknown as typeof fetch
    );

    render(<PasswordGate onAuthorize={() => undefined} />);

    fireEvent.change(screen.getByPlaceholderText('Enter passcode'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enter' }));

    expect(await screen.findByText('Login failed')).toBeTruthy();
  });

  it('shows Network error when fetch throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('boom'))) as unknown as typeof fetch
    );

    render(<PasswordGate onAuthorize={() => undefined} />);

    fireEvent.change(screen.getByPlaceholderText('Enter passcode'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enter' }));

    expect(await screen.findByText('Network error')).toBeTruthy();
  });
});

