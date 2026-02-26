import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseModelResponses, parseWinner, promptFromSidebarNode } from '../promptAdapter';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('parseModelResponses', () => {
  it('returns [] for empty/whitespace strings', () => {
    expect(parseModelResponses('')).toEqual([]);
    expect(parseModelResponses('   ')).toEqual([]);
    expect(parseModelResponses('\n\t')).toEqual([]);
  });

  it('parses a JSON string array and filters invalid items', () => {
    const input = JSON.stringify([
      { model_id: 'm1', response: 'r1', created_at: '2024-01-01T00:00:00Z' },
      { model_id: 'm2', response: 'r2', created_at: 123 },
      { model_id: 'bad', response: 42 },
      { response: 'missing id' },
      'not an object',
      null,
    ]);

    expect(parseModelResponses(input)).toEqual([
      { model_id: 'm1', response: 'r1', created_at: '2024-01-01T00:00:00Z' },
      { model_id: 'm2', response: 'r2', created_at: undefined },
    ]);
  });

  it('returns [] and logs an error for invalid JSON strings', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(parseModelResponses('{nope')).toEqual([]);
    expect(spy).toHaveBeenCalled();
  });

  it('accepts already-parsed arrays', () => {
    expect(parseModelResponses([{ model_id: 'm1', response: 'r1' }])).toEqual([
      { model_id: 'm1', response: 'r1', created_at: undefined },
    ]);
  });

  it('accepts objects with an items array', () => {
    expect(parseModelResponses({ items: [{ model_id: 'm1', response: 'r1' }] })).toEqual([
      { model_id: 'm1', response: 'r1', created_at: undefined },
    ]);
  });

  it('returns [] for unsupported shapes', () => {
    expect(parseModelResponses(null)).toEqual([]);
    expect(parseModelResponses(undefined)).toEqual([]);
    expect(parseModelResponses(123)).toEqual([]);
    expect(parseModelResponses({ items: 'nope' })).toEqual([]);
    expect(parseModelResponses({})).toEqual([]);
  });
});

describe('parseWinner', () => {
  it('accepts supported enum values', () => {
    expect(parseWinner('llama')).toBe('llama');
    expect(parseWinner('gemini')).toBe('gemini');
  });

  it('throws for unsupported or missing enum values', () => {
    expect(() => parseWinner(null)).toThrow(/Unsupported winner value from backend/);
    expect(() => parseWinner(undefined)).toThrow(/Unsupported winner value from backend/);
    expect(() => parseWinner('%future added value' as never)).toThrow(
      /Unsupported winner value from backend/
    );
  });
});

describe('promptFromSidebarNode', () => {
  it('maps a sidebar node into a domain Prompt (including parsing model_responses)', () => {
    const node = {
      id: 123,
      title: 'T',
      instructions: 'I',
      icon: '⭐',
      winner: 'llama',
      model_responses: JSON.stringify([{ model_id: 'm1', response: 'r1' }]),
    } as unknown as Parameters<typeof promptFromSidebarNode>[0];

    expect(promptFromSidebarNode(node)).toEqual({
      id: '123',
      title: 'T',
      instructions: 'I',
      icon: '⭐',
      winner: 'llama',
      modelResponses: [{ model_id: 'm1', response: 'r1', created_at: undefined }],
    });
  });

  it('throws when id stringifies to an empty string', () => {
    const node = {
      id: '',
      title: 'T',
      instructions: 'I',
      icon: '⭐',
      winner: 'llama',
      model_responses: [],
    } as unknown as Parameters<typeof promptFromSidebarNode>[0];

    expect(() => promptFromSidebarNode(node)).toThrow(/Missing prompt id/);
  });
});
