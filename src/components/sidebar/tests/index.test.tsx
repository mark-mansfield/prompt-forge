/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { Sidebar, SidebarWithSheet } from '../';
import type {
  sidebar_prompts_fragment$data,
  sidebar_prompts_fragment$key,
} from '../__generated__/sidebar_prompts_fragment.graphql';

const relayMocks = vi.hoisted(() => ({
  useLazyLoadQuery: vi.fn(),
  useFragment: vi.fn(),
}));

const adapterMocks = vi.hoisted(() => ({
  promptFromSidebarNode: vi.fn(),
}));

vi.mock('react-relay', () => ({
  graphql: (x: unknown) => x,
  useLazyLoadQuery: relayMocks.useLazyLoadQuery,
  useFragment: relayMocks.useFragment,
}));

vi.mock('../tabs', () => ({
  Tabs: ({ activeTabId }: { activeTabId: string }) => <div data-testid="tabs">{activeTabId}</div>,
}));

vi.mock('../../../domain/promptAdapter', () => ({
  promptFromSidebarNode: adapterMocks.promptFromSidebarNode,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

type SidebarPromptNode = sidebar_prompts_fragment$data[number];

const makeSidebarNode = (overrides?: Partial<SidebarPromptNode>): SidebarPromptNode =>
  ({
    id: '1',
    title: 'Prompt 1',
    icon: '🔥',
    instructions: 'Do it',
    winner: 'llama',
    model_responses: [],
    ' $fragmentType': 'sidebar_prompts_fragment',
    ...overrides,
  } satisfies SidebarPromptNode);

describe('Sidebar', () => {
  it('renders header, tabs, and prompt list', () => {
    relayMocks.useLazyLoadQuery.mockReturnValue({ activeTabId: 'all' });
    relayMocks.useFragment.mockReturnValue([
      makeSidebarNode({ id: '1', title: 'One', winner: 'llama' }),
      makeSidebarNode({ id: '2', title: 'Two', winner: 'gemini' }),
    ]);

    render(
      <Sidebar
        promptNodesRef={null as unknown as sidebar_prompts_fragment$key}
        handleLoadPrompt={() => undefined}
      />
    );

    expect(screen.getByText('PromptForge')).toBeTruthy();
    expect(screen.getByText('Recent prompts')).toBeTruthy();
    expect(screen.getByTestId('tabs').textContent).toBe('all');

    expect(screen.getByRole('button', { name: /One$/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Two$/ })).toBeTruthy();
  });

  it('filters prompts by activeTabId using winner → modelId mapping', () => {
    relayMocks.useLazyLoadQuery.mockReturnValue({ activeTabId: 'llama-3.1-8b-instant' });
    relayMocks.useFragment.mockReturnValue([
      makeSidebarNode({ id: '1', title: 'Llama winner keyword', winner: 'llama' }),
      makeSidebarNode({ id: '2', title: 'Gemini', winner: 'gemini' }),
    ]);

    render(
      <Sidebar
        promptNodesRef={null as unknown as sidebar_prompts_fragment$key}
        handleLoadPrompt={() => undefined}
      />
    );

    expect(screen.getByRole('button', { name: /Llama winner keyword$/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Gemini$/ })).toBeNull();
  });

  it('clicking a prompt adapts the node and calls handleLoadPrompt', () => {
    const handleLoadPrompt = vi.fn();
    const node = makeSidebarNode({ id: '99', title: 'Click me' });
    const adapted = {
      title: 'Adapted',
      instructions: 'x',
      icon: 'y',
      winner: null,
      modelResponses: [],
    };

    relayMocks.useLazyLoadQuery.mockReturnValue({ activeTabId: 'all' });
    relayMocks.useFragment.mockReturnValue([node]);
    adapterMocks.promptFromSidebarNode.mockReturnValue(adapted);

    render(
      <Sidebar
        promptNodesRef={null as unknown as sidebar_prompts_fragment$key}
        handleLoadPrompt={handleLoadPrompt}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Click me$/ }));

    expect(adapterMocks.promptFromSidebarNode).toHaveBeenCalledTimes(1);
    expect(adapterMocks.promptFromSidebarNode).toHaveBeenCalledWith(node);
    expect(handleLoadPrompt).toHaveBeenCalledTimes(1);
    expect(handleLoadPrompt).toHaveBeenCalledWith(adapted);
  });
});

describe('SidebarWithSheet', () => {
  it('does not render the mobile dialog when closed', () => {
    relayMocks.useLazyLoadQuery.mockReturnValue({ activeTabId: 'all' });
    relayMocks.useFragment.mockReturnValue([makeSidebarNode({ id: '1', title: 'One', winner: 'llama' })]);

    render(
      <SidebarWithSheet
        isOpen={false}
        onClose={() => undefined}
        sidebarProps={{
          promptNodesRef: null as unknown as sidebar_prompts_fragment$key,
          handleLoadPrompt: () => undefined,
        }}
      />
    );

    expect(screen.queryByRole('dialog', { name: 'Sidebar' })).toBeNull();
  });

  it('renders the mobile dialog when open and closes via button and Escape', () => {
    relayMocks.useLazyLoadQuery.mockReturnValue({ activeTabId: 'all' });
    relayMocks.useFragment.mockReturnValue([makeSidebarNode({ id: '1', title: 'One', winner: 'llama' })]);

    const onClose = vi.fn();
    render(
      <SidebarWithSheet
        isOpen={true}
        onClose={onClose}
        sidebarProps={{
          promptNodesRef: null as unknown as sidebar_prompts_fragment$key,
          handleLoadPrompt: () => undefined,
        }}
      />
    );

    const dialog = screen.getByRole('dialog', { name: 'Sidebar' });
    const closeButton = within(dialog).getByRole('button', { name: 'Close sidebar' });
    expect(document.activeElement).toBe(closeButton);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('locks body scroll while open and restores it on close', () => {
    relayMocks.useLazyLoadQuery.mockReturnValue({ activeTabId: 'all' });
    relayMocks.useFragment.mockReturnValue([makeSidebarNode({ id: '1', title: 'One', winner: 'llama' })]);

    document.body.style.overflow = 'auto';

    const { rerender } = render(
      <SidebarWithSheet
        isOpen={true}
        onClose={() => undefined}
        sidebarProps={{
          promptNodesRef: null as unknown as sidebar_prompts_fragment$key,
          handleLoadPrompt: () => undefined,
        }}
      />
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <SidebarWithSheet
        isOpen={false}
        onClose={() => undefined}
        sidebarProps={{
          promptNodesRef: null as unknown as sidebar_prompts_fragment$key,
          handleLoadPrompt: () => undefined,
        }}
      />
    );

    expect(document.body.style.overflow).toBe('auto');
  });

  it('loads a prompt from the mobile sheet and calls onClose', () => {
    relayMocks.useLazyLoadQuery.mockReturnValue({ activeTabId: 'all' });
    relayMocks.useFragment.mockReturnValue([makeSidebarNode({ id: '1', title: 'One', winner: 'llama' })]);

    const onClose = vi.fn();
    const handleLoadPrompt = vi.fn();
    const adapted = { title: 'Adapted', instructions: 'x', icon: 'y', winner: null, modelResponses: [] };
    adapterMocks.promptFromSidebarNode.mockReturnValue(adapted);

    render(
      <SidebarWithSheet
        isOpen={true}
        onClose={onClose}
        sidebarProps={{
          promptNodesRef: null as unknown as sidebar_prompts_fragment$key,
          handleLoadPrompt,
        }}
      />
    );

    const dialog = screen.getByRole('dialog', { name: 'Sidebar' });
    fireEvent.click(within(dialog).getByRole('button', { name: /One$/ }));

    expect(handleLoadPrompt).toHaveBeenCalledTimes(1);
    expect(handleLoadPrompt).toHaveBeenCalledWith(adapted);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
