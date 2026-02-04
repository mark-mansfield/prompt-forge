/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { PromptEditor } from '../';
import type { DraftPrompt } from '../../layout/types';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const makePrompt = (overrides?: Partial<DraftPrompt>): DraftPrompt => ({
  title: 'My prompt',
  instructions: 'Do the thing',
  icon: 'sparkles',
  winner: null,
  modelResponses: [],
  ...overrides,
});

describe('PromptEditor', () => {
  it('wires up title and instructions inputs', () => {
    const setTitle = vi.fn();
    const setInstructions = vi.fn();

    render(
      <PromptEditor
        prompt={makePrompt({ title: 'Old title', instructions: 'Old instructions' })}
        handleExecutePrompt={() => undefined}
        handleStop={() => undefined}
        handleClear={() => undefined}
        isLoading={false}
        canSave={false}
        canDelete={false}
        handleSave={() => undefined}
        handleDelete={() => undefined}
        setTitle={setTitle}
        setInstructions={setInstructions}
        applyModifier={() => 'added'}
        modifierTextByType={{ clear: 'Clear text', quality: 'Better output', tone: 'Friendlier' }}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Prompt title...'), {
      target: { value: 'New title' },
    });
    expect(setTitle).toHaveBeenCalledWith('New title');

    fireEvent.change(screen.getByPlaceholderText('Enter your prompt here...'), {
      target: { value: 'New instructions' },
    });
    expect(setInstructions).toHaveBeenCalledWith('New instructions');
  });

  it('enables/disables Run and Stop based on instructions and loading state', () => {
    const handleExecutePrompt = vi.fn();
    const handleStop = vi.fn();

    const { rerender } = render(
      <PromptEditor
        prompt={makePrompt({ instructions: '   ' })}
        handleExecutePrompt={handleExecutePrompt}
        handleStop={handleStop}
        handleClear={() => undefined}
        isLoading={false}
        canSave={false}
        canDelete={false}
        handleSave={() => undefined}
        handleDelete={() => undefined}
        setTitle={() => undefined}
        setInstructions={() => undefined}
        applyModifier={() => 'added'}
        modifierTextByType={{ clear: 'Clear text', quality: 'Better output', tone: 'Friendlier' }}
      />
    );

    const run = screen.getByRole('button', { name: 'Test prompt' }) as HTMLButtonElement;
    const stop = screen.getByRole('button', { name: 'Stop' }) as HTMLButtonElement;

    expect(run.disabled).toBe(true);
    expect(stop.disabled).toBe(true);

    rerender(
      <PromptEditor
        prompt={makePrompt({ instructions: 'Hello' })}
        handleExecutePrompt={handleExecutePrompt}
        handleStop={handleStop}
        handleClear={() => undefined}
        isLoading={false}
        canSave={false}
        canDelete={false}
        handleSave={() => undefined}
        handleDelete={() => undefined}
        setTitle={() => undefined}
        setInstructions={() => undefined}
        applyModifier={() => 'added'}
        modifierTextByType={{ clear: 'Clear text', quality: 'Better output', tone: 'Friendlier' }}
      />
    );

    expect((screen.getByRole('button', { name: 'Test prompt' }) as HTMLButtonElement).disabled).toBe(
      false
    );
    expect((screen.getByRole('button', { name: 'Stop' }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Test prompt' }));
    expect(handleExecutePrompt).toHaveBeenCalledTimes(1);

    rerender(
      <PromptEditor
        prompt={makePrompt({ instructions: 'Hello' })}
        handleExecutePrompt={handleExecutePrompt}
        handleStop={handleStop}
        handleClear={() => undefined}
        isLoading={true}
        canSave={false}
        canDelete={false}
        handleSave={() => undefined}
        handleDelete={() => undefined}
        setTitle={() => undefined}
        setInstructions={() => undefined}
        applyModifier={() => 'added'}
        modifierTextByType={{ clear: 'Clear text', quality: 'Better output', tone: 'Friendlier' }}
      />
    );

    expect(screen.getByText('Testing...')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Test prompt' }) as HTMLButtonElement).disabled).toBe(
      true
    );
    expect((screen.getByRole('button', { name: 'Stop' }) as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(handleStop).toHaveBeenCalledTimes(1);
  });

  it('calls Clear/Save/Delete handlers and respects disabled state', () => {
    const handleClear = vi.fn();
    const handleSave = vi.fn();
    const handleDelete = vi.fn();

    const { rerender } = render(
      <PromptEditor
        prompt={makePrompt()}
        handleExecutePrompt={() => undefined}
        handleStop={() => undefined}
        handleClear={handleClear}
        isLoading={false}
        canSave={false}
        canDelete={false}
        handleSave={handleSave}
        handleDelete={handleDelete}
        setTitle={() => undefined}
        setInstructions={() => undefined}
        applyModifier={() => 'added'}
        modifierTextByType={{ clear: 'Clear text', quality: 'Better output', tone: 'Friendlier' }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear prompt' }));
    expect(handleClear).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete prompt' }));
    expect(handleSave).toHaveBeenCalledTimes(0);
    expect(handleDelete).toHaveBeenCalledTimes(0);

    rerender(
      <PromptEditor
        prompt={makePrompt()}
        handleExecutePrompt={() => undefined}
        handleStop={() => undefined}
        handleClear={handleClear}
        isLoading={false}
        canSave={true}
        canDelete={true}
        handleSave={handleSave}
        handleDelete={handleDelete}
        setTitle={() => undefined}
        setInstructions={() => undefined}
        applyModifier={() => 'added'}
        modifierTextByType={{ clear: 'Clear text', quality: 'Better output', tone: 'Friendlier' }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete prompt' }));
    expect(handleSave).toHaveBeenCalledTimes(1);
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  it('renders openSidebarButton when provided', () => {
    render(
      <PromptEditor
        prompt={makePrompt()}
        handleExecutePrompt={() => undefined}
        handleStop={() => undefined}
        handleClear={() => undefined}
        isLoading={false}
        canSave={false}
        canDelete={false}
        handleSave={() => undefined}
        handleDelete={() => undefined}
        setTitle={() => undefined}
        setInstructions={() => undefined}
        applyModifier={() => 'added'}
        modifierTextByType={{ clear: 'Clear text', quality: 'Better output', tone: 'Friendlier' }}
        openSidebarButton={<button>Open sidebar</button>}
      />
    );

    expect(screen.getByRole('button', { name: 'Open sidebar' })).toBeTruthy();
  });

  it('announces modifier changes via aria-live and sets aria-pressed from activeModifiers', async () => {
    vi.stubGlobal('requestAnimationFrame', ((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    }) as unknown as typeof requestAnimationFrame);

    const applyModifier = vi.fn().mockReturnValueOnce('added').mockReturnValueOnce('removed');

    render(
      <PromptEditor
        prompt={makePrompt()}
        handleExecutePrompt={() => undefined}
        handleStop={() => undefined}
        handleClear={() => undefined}
        isLoading={false}
        canSave={false}
        canDelete={false}
        handleSave={() => undefined}
        handleDelete={() => undefined}
        setTitle={() => undefined}
        setInstructions={() => undefined}
        applyModifier={applyModifier}
        modifierTextByType={{
          clear: 'Make it easier to read.',
          quality: 'Increase detail and correctness.',
          tone: 'Make it sound more friendly.',
        }}
        activeModifiers={['quality']}
      />
    );

    expect(screen.getByRole('button', { name: 'Quality' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Clarity' }).getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: 'Clarity' }));
    expect(applyModifier).toHaveBeenCalledWith('clear');

    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain(
        'Clarity modifier applied. Make it easier to read.'
      )
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clarity' }));
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain('Clarity modifier removed.')
    );
  });

  it('can verify instructions changes when a parent toggles modifiers', async () => {
    vi.stubGlobal('requestAnimationFrame', ((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    }) as unknown as typeof requestAnimationFrame);

    const modifierTextByType = {
      clear: 'Make it easier to read.',
      quality: 'Increase detail and correctness.',
      tone: 'Make it sound more friendly.',
    } as const;

    const Wrapper = () => {
      const [title, setTitle] = useState('My prompt');
      const [instructions, setInstructions] = useState('Base instructions');
      const [activeModifiers, setActiveModifiers] = useState<Array<'clear' | 'quality' | 'tone'>>([]);

      const applyModifier = (type: 'clear' | 'quality' | 'tone') => {
        const has = activeModifiers.includes(type);

        if (has) {
          setActiveModifiers((prev) => prev.filter((t) => t !== type));
          setInstructions('Base instructions');
          return 'removed' as const;
        }

        setActiveModifiers((prev) => [...prev, type]);
        setInstructions(`Base instructions\n\n${modifierTextByType[type]}`);
        return 'added' as const;
      };

      return (
        <PromptEditor
          prompt={makePrompt({ title, instructions })}
          handleExecutePrompt={() => undefined}
          handleStop={() => undefined}
          handleClear={() => undefined}
          isLoading={false}
          canSave={false}
          canDelete={false}
          handleSave={() => undefined}
          handleDelete={() => undefined}
          setTitle={setTitle}
          setInstructions={setInstructions}
          applyModifier={applyModifier}
          modifierTextByType={modifierTextByType}
          activeModifiers={activeModifiers}
        />
      );
    };

    render(<Wrapper />);

    const textarea = screen.getByPlaceholderText('Enter your prompt here...') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Base instructions');
    expect(screen.getByRole('button', { name: 'Clarity' }).getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: 'Clarity' }));

    await waitFor(() =>
      expect((screen.getByPlaceholderText('Enter your prompt here...') as HTMLTextAreaElement).value).toBe(
        'Base instructions\n\nMake it easier to read.'
      )
    );
    expect(screen.getByRole('button', { name: 'Clarity' }).getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Clarity' }));
    await waitFor(() =>
      expect((screen.getByPlaceholderText('Enter your prompt here...') as HTMLTextAreaElement).value).toBe(
        'Base instructions'
      )
    );
    expect(screen.getByRole('button', { name: 'Clarity' }).getAttribute('aria-pressed')).toBe('false');
  });
});

