/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ModelResponse } from '../';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ModelResponse', () => {
  it('renders model name, idle status, and placeholder when response is empty', () => {
    const { container } = render(
      <ModelResponse modelName="Gemini" response="" winnerButton={<div>Winner</div>} />
    );

    expect(screen.getByText('Gemini')).toBeTruthy();
    expect(screen.getByText('Idle')).toBeTruthy();
    expect(screen.getByText('Response will appear here...')).toBeTruthy();

    const dot = container.querySelector('span[aria-hidden="true"]');
    expect(dot).toBeTruthy();
    expect(dot?.getAttribute('class')).toContain('bg-slate-500');
  });

  it('renders the response text and hides the placeholder', () => {
    render(
      <ModelResponse modelName="Claude" response="Hello!" status="done" winnerButton={<div />} />
    );

    expect(screen.getByText('Hello!')).toBeTruthy();
    expect(screen.queryByText('Response will appear here...')).toBeNull();
    expect(screen.getByText('Done')).toBeTruthy();
  });

  it('renders an error message and hides the placeholder when status=error and response is empty', () => {
    render(
      <ModelResponse
        modelName="GPT"
        response=""
        status="error"
        error="Something went wrong"
        winnerButton={<div />}
      />
    );

    expect(screen.getByText('Error')).toBeTruthy();
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.queryByText('Response will appear here...')).toBeNull();
  });

  it('shows Stop button while streaming and calls onAbort', () => {
    const onAbort = vi.fn();
    render(
      <ModelResponse
        modelName="Llama"
        response=""
        status="streaming"
        onAbort={onAbort}
        winnerButton={<div />}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(onAbort).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('shows Retry button for idle/aborted/error and calls onRetry', () => {
    const onRetry = vi.fn();
    render(
      <ModelResponse
        modelName="Mistral"
        response=""
        status="aborted"
        onRetry={onRetry}
        winnerButton={<div />}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Cancelled')).toBeTruthy();
  });

  it('renders headerInline and token usage line when usage is provided', () => {
    render(
      <ModelResponse
        modelName="DeepSeek"
        response="Ok"
        status="done"
        headerInline={<span>Inline</span>}
        usage={{ totalTokens: 10, inputTokens: 3, outputTokens: 7 }}
        winnerButton={<div />}
      />
    );

    expect(screen.getByText('Inline')).toBeTruthy();
    expect(screen.getByText('Tokens: 10 (in 3 / out 7)')).toBeTruthy();
  });

  it('renders em dashes for missing token values when usage is partial', () => {
    render(
      <ModelResponse
        modelName="DeepSeek"
        response="Ok"
        status="done"
        usage={{ inputTokens: 2 }}
        winnerButton={<div />}
      />
    );

    expect(screen.getByText('Tokens: — (in 2 / out —)')).toBeTruthy();
  });
});
