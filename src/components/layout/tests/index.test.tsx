/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { DeletePromptMutation, Layout, SavePromptMutation, UpdatePromptMutation } from '../';
import type { Prompt } from '../types';

const relayMocks = vi.hoisted(() => ({
  useLazyLoadQuery: vi.fn(),
  useMutation: vi.fn(),
}));

const updatersMocks = vi.hoisted(() => ({
  addPromptToSidebarConnection: vi.fn(),
  updatePromptInSidebarConnection: vi.fn(),
  removePromptFromSidebarConnection: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

const mutationCommits = vi.hoisted(() => ({
  save: vi.fn(),
  update: vi.fn(),
  del: vi.fn(),
}));

const sidebarMocks = vi.hoisted(() => ({
  promptToLoad: null as Prompt | null,
}));

vi.mock('react-relay', () => ({
  graphql: (x: unknown) => x,
  useLazyLoadQuery: relayMocks.useLazyLoadQuery,
  useMutation: relayMocks.useMutation,
}));

vi.mock('../../../relay/hooks/useSavedPromptsConnectionUpdaters', () => ({
  useSavedPromptsConnectionUpdaters: () => updatersMocks,
}));

vi.mock('sonner', () => ({
  toast: toastMocks,
}));

vi.mock('../../prompt-editor', () => ({
  PromptEditor: (props: {
    prompt: { title: string; instructions: string };
    setTitle: (x: string) => void;
    setInstructions: (x: string) => void;
    canSave: boolean;
    canDelete: boolean;
    handleSave: () => void;
    handleDelete: () => void;
    openSidebarButton?: React.ReactNode;
  }) => {
    return (
      <div>
        {props.openSidebarButton}
        <label>
          Title
          <input
            aria-label="Title"
            placeholder="Prompt title..."
            value={props.prompt.title}
            onChange={(e) => props.setTitle(e.target.value)}
          />
        </label>
        <label>
          Instructions
          <textarea
            aria-label="Instructions"
            placeholder="Enter your prompt here..."
            value={props.prompt.instructions}
            onChange={(e) => props.setInstructions(e.target.value)}
          />
        </label>
        <button type="button" onClick={props.handleSave} disabled={!props.canSave}>
          Save
        </button>
        <button type="button" onClick={props.handleSave}>
          Force save
        </button>
        <button type="button" onClick={props.handleDelete} disabled={!props.canDelete}>
          Delete prompt
        </button>
      </div>
    );
  },
}));

const DEFAULT_LOADED_PROMPT: Prompt = {
  id: 'p-1',
  title: 'Loaded title',
  instructions: 'Loaded instructions',
  icon: '🦙',
  winner: 'llama',
  modelResponses: [{ model_id: 'llama', response: 'hello there' }],
};

vi.mock('../../sidebar', () => ({
  SidebarWithSheet: (props: {
    isOpen: boolean;
    onClose: () => void;
    sidebarProps: {
      handleLoadPrompt: (p: Prompt) => void;
    };
  }) => {
    return props.isOpen ? (
      <div role="dialog" aria-label="Sidebar">
        <button type="button" onClick={props.onClose}>
          Close sidebar
        </button>
        <button
          type="button"
          onClick={() =>
            props.sidebarProps.handleLoadPrompt(sidebarMocks.promptToLoad ?? DEFAULT_LOADED_PROMPT)
          }
        >
          Load example prompt
        </button>
      </div>
    ) : null;
  },
}));

vi.mock('../../model-response', () => ({
  ModelResponse: (props: { modelName: string; winnerButton?: React.ReactNode }) => (
    <div data-testid={`model-response-${props.modelName}`}>{props.winnerButton}</div>
  ),
}));

vi.mock('../../winner-button', () => ({
  WinnerButton: (props: { label: string; onClick: () => void; isWinner: boolean }) => (
    <button type="button" onClick={props.onClick} aria-pressed={props.isWinner}>
      Pick winner {props.label}
    </button>
  ),
}));

afterEach(() => {
  cleanup();
  sidebarMocks.promptToLoad = null;
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function setRelaySavedPrompts(nodes: Array<Record<string, unknown>>) {
  relayMocks.useLazyLoadQuery.mockReturnValue({
    saved_promptsCollection: {
      edges: nodes.map((node) => ({ node })),
    },
  });
}

describe('Layout', () => {
  it('disables the open-sidebar button when there are no saved prompts', () => {
    sidebarMocks.promptToLoad = null;
    setRelaySavedPrompts([]);
    relayMocks.useMutation.mockImplementation(() => [vi.fn(), false]);

    render(<Layout />);

    const open = screen.getByRole('button', { name: 'Open sidebar' }) as HTMLButtonElement;
    expect(open.disabled).toBe(true);
    expect(open.getAttribute('title')).toBe('No prompts yet');
  });

  it('opens the sidebar and restores focus on close', () => {
    sidebarMocks.promptToLoad = null;
    // Run requestAnimationFrame callbacks immediately so focus restoration runs in test.
    vi.stubGlobal('requestAnimationFrame', ((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    }) as unknown as typeof requestAnimationFrame);

    setRelaySavedPrompts([{ id: '1' }]);
    relayMocks.useMutation.mockImplementation(() => [vi.fn(), false]);

    render(<Layout />);

    const textarea = screen.getByLabelText('Instructions') as HTMLTextAreaElement;
    textarea.focus();
    expect(document.activeElement).toBe(textarea);

    fireEvent.click(screen.getByRole('button', { name: 'Open sidebar' }));

    const dialog = screen.getByRole('dialog', { name: 'Sidebar' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close sidebar' }));

    expect(document.activeElement).toBe(textarea);
  });

  it('loads a prompt into editor state and enables delete', () => {
    sidebarMocks.promptToLoad = null;
    setRelaySavedPrompts([{ id: '1' }]);
    relayMocks.useMutation.mockImplementation(() => [vi.fn(), false]);

    render(<Layout />);

    fireEvent.click(screen.getByRole('button', { name: 'Open sidebar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Load example prompt' }));

    const title = screen.getByLabelText('Title') as HTMLInputElement;
    const instructions = screen.getByLabelText('Instructions') as HTMLTextAreaElement;
    const del = screen.getByRole('button', { name: 'Delete prompt' }) as HTMLButtonElement;

    expect(title.value).toBe('Loaded title');
    expect(instructions.value).toBe('Loaded instructions');
    expect(del.disabled).toBe(false);
  });

  it('saves an edited existing prompt via update mutation and normalizes model ids', () => {
    sidebarMocks.promptToLoad = null;
    setRelaySavedPrompts([{ id: '1' }]);

    relayMocks.useMutation.mockImplementation((doc: unknown) => {
      if (doc === SavePromptMutation) return [mutationCommits.save, false];
      if (doc === UpdatePromptMutation) return [mutationCommits.update, false];
      if (doc === DeletePromptMutation) return [mutationCommits.del, false];
      return [vi.fn(), false];
    });

    render(<Layout />);

    // Load a prompt (sets editingId + modelResponses).
    fireEvent.click(screen.getByRole('button', { name: 'Open sidebar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Load example prompt' }));

    // Change title to make it dirty.
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Loaded title (edited)' } });

    const save = screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement;
    expect(save.disabled).toBe(false);

    fireEvent.click(save);

    expect(mutationCommits.update).toHaveBeenCalledTimes(1);
    const cfg = mutationCommits.update.mock.calls[0]?.[0] as {
      variables: {
        filter: { id: { eq: string } };
        set: { title: string; instructions: string; icon: string; winner: string; model_responses: string };
      };
      optimisticUpdater: (store: unknown) => void;
      updater: (store: unknown) => void;
    };

    expect(cfg.variables.filter.id.eq).toBe('p-1');
    expect(cfg.variables.set.title).toBe('Loaded title (edited)');
    expect(cfg.variables.set.instructions).toBe('Loaded instructions');
    expect(cfg.variables.set.winner).toBe('llama');
    expect(cfg.variables.set.icon).toBe('🦙');
    expect(cfg.variables.set.model_responses).toBe(
      JSON.stringify([{ model_id: 'llama-3.1-8b-instant', response: 'hello there' }])
    );

    // Updaters should wire through to the sidebar connection updater.
    const store = {};
    cfg.optimisticUpdater(store);
    cfg.updater(store);
    expect(updatersMocks.updatePromptInSidebarConnection).toHaveBeenCalledWith(store, 'p-1', {
      title: 'Loaded title (edited)',
      instructions: 'Loaded instructions',
      icon: '🦙',
      winner: 'llama',
    });
  });

  it('refuses to update-save if the loaded prompt has no model output (Layout guard)', () => {
    sidebarMocks.promptToLoad = {
      ...DEFAULT_LOADED_PROMPT,
      modelResponses: [{ model_id: 'llama', response: '   ' }],
    };
    setRelaySavedPrompts([{ id: '1' }]);

    relayMocks.useMutation.mockImplementation((doc: unknown) => {
      if (doc === SavePromptMutation) return [mutationCommits.save, false];
      if (doc === UpdatePromptMutation) return [mutationCommits.update, false];
      if (doc === DeletePromptMutation) return [mutationCommits.del, false];
      return [vi.fn(), false];
    });

    render(<Layout />);

    fireEvent.click(screen.getByRole('button', { name: 'Open sidebar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Load example prompt' }));

    // Save is disabled (no model output), but Layout's save handler still has a guard.
    fireEvent.click(screen.getByRole('button', { name: 'Force save' }));

    expect(toastMocks.error).toHaveBeenCalledWith('Run a model at least once before saving');
    expect(mutationCommits.update).not.toHaveBeenCalled();
  });
});

