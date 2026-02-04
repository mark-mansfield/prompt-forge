/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Tabs } from '../';

const relayMocks = vi.hoisted(() => ({
  useRelayEnvironment: vi.fn(),
}));

const uiStateMocks = vi.hoisted(() => ({
  setActiveTabId: vi.fn(),
}));

vi.mock('react-relay', () => ({
  useRelayEnvironment: relayMocks.useRelayEnvironment,
}));

vi.mock('../../../../utils/ui-state', () => ({
  setActiveTabId: uiStateMocks.setActiveTabId,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Tabs', () => {
  it('renders all tabs with correct titles', () => {
    relayMocks.useRelayEnvironment.mockReturnValue({} as unknown);

    render(<Tabs activeTabId="all" />);

    const all = screen.getByRole('button', { name: 'All' });
    const llama = screen.getByRole('button', { name: 'Llama' });
    const gemini = screen.getByRole('button', { name: 'Gemini' });

    expect(all.getAttribute('title')).toBe('All');
    expect(llama.getAttribute('title')).toBe('llama-3.1-8b-instant');
    expect(gemini.getAttribute('title')).toBe('gemini-2.5-flash');
  });

  it('marks the active tab via className', () => {
    relayMocks.useRelayEnvironment.mockReturnValue({} as unknown);

    render(<Tabs activeTabId="gemini-2.5-flash" />);

    expect(screen.getByRole('button', { name: 'Gemini' }).getAttribute('class')).toContain(
      'text-white border-b-2 border-blue-500'
    );
    expect(screen.getByRole('button', { name: 'All' }).getAttribute('class')).toContain(
      'border-transparent'
    );
    expect(screen.getByRole('button', { name: 'Llama' }).getAttribute('class')).toContain(
      'border-transparent'
    );
  });

  it('calls setActiveTabId with environment and clicked tab id', () => {
    const env = { __test: true };
    relayMocks.useRelayEnvironment.mockReturnValue(env as unknown);

    render(<Tabs activeTabId="all" />);

    fireEvent.click(screen.getByRole('button', { name: 'Llama' }));
    expect(uiStateMocks.setActiveTabId).toHaveBeenCalledTimes(1);
    expect(uiStateMocks.setActiveTabId).toHaveBeenCalledWith(env, 'llama-3.1-8b-instant');
  });
});

