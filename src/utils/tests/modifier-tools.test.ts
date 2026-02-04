import { describe, expect, it } from 'vitest';

import {
  detectActiveModifiers,
  MODIFIERS,
  toggleModifierInText,
  type ModifierType,
} from '../modifier-tools';

function asSortedArray<T>(set: Set<T>): T[] {
  return Array.from(set).sort();
}

describe('modifier-tools', () => {
  describe('detectActiveModifiers', () => {
    it('returns an empty set for empty/whitespace/unrelated text', () => {
      expect(asSortedArray(detectActiveModifiers(''))).toEqual([]);
      expect(asSortedArray(detectActiveModifiers('   \n\t'))).toEqual([]);
      expect(asSortedArray(detectActiveModifiers('Just some content.'))).toEqual([]);
    });

    it('detects canonical modifier paragraphs (exact match)', () => {
      const text = ['Intro paragraph.', MODIFIERS.clear, 'Outro paragraph.'].join('\n\n');
      expect(asSortedArray(detectActiveModifiers(text))).toEqual(['clear']);
    });

    it('detects signature matches (case-insensitive, >= minMatches keywords)', () => {
      const cases: Array<{ type: ModifierType; paragraph: string }> = [
        {
          type: 'clear',
          paragraph: 'Please use PERFECT GRAMMAR and ACTIVE VOICE in the response.',
        },
        {
          type: 'quality',
          paragraph: 'Be comprehensive; include examples to support your answer.',
        },
        {
          type: 'tone',
          paragraph: 'Match a professional tone. Be confident and direct.',
        },
      ];

      for (const { type, paragraph } of cases) {
        const text = `Top\n\n${paragraph}\n\nBottom`;
        expect(asSortedArray(detectActiveModifiers(text))).toEqual([type]);
      }
    });

    it('does not activate when only one signature keyword is present', () => {
      expect(asSortedArray(detectActiveModifiers('Try to use active voice.'))).toEqual([]);
      expect(asSortedArray(detectActiveModifiers('Be comprehensive.'))).toEqual([]);
      expect(asSortedArray(detectActiveModifiers('Use a professional tone.'))).toEqual([]);
    });

    it('handles multiple blank lines and trims paragraphs', () => {
      const text = `  ${MODIFIERS.quality}  \n\n\nSecond paragraph.\n\n`;
      expect(asSortedArray(detectActiveModifiers(text))).toEqual(['quality']);
    });
  });

  describe('toggleModifierInText', () => {
    it('adds the modifier to empty/whitespace text', () => {
      expect(toggleModifierInText('', 'clear')).toEqual({
        nextText: MODIFIERS.clear,
        action: 'added',
      });
      expect(toggleModifierInText('   \n\t', 'tone')).toEqual({
        nextText: MODIFIERS.tone,
        action: 'added',
      });
    });

    it('adds the modifier after existing text with a blank line separator and trims trailing whitespace', () => {
      const input = 'Hello world.\n\n';
      const result = toggleModifierInText(input, 'quality');
      expect(result.action).toBe('added');
      expect(result.nextText).toBe(`Hello world.\n\n${MODIFIERS.quality}`);
    });

    it('removes a canonical modifier paragraph and preserves remaining paragraphs', () => {
      const input = ['Keep me.', MODIFIERS.clear, 'Also keep me.'].join('\n\n') + '\n\n';
      const result = toggleModifierInText(input, 'clear');
      expect(result).toEqual({ nextText: 'Keep me.\n\nAlso keep me.', action: 'removed' });
    });

    it('removes signature-matching paragraphs (not only canonical ones)', () => {
      const signatureParagraph =
        'Match professional tone. Be confident and persuasive when you answer.'; // 3/3 keywords
      const input = ['Top', signatureParagraph, 'Bottom'].join('\n\n');
      const result = toggleModifierInText(input, 'tone');
      expect(result).toEqual({ nextText: 'Top\n\nBottom', action: 'removed' });
    });

    it('when active via signature only, toggling removes it rather than adding canonical', () => {
      const signatureParagraph = 'Be comprehensive and include examples.'; // 2/3 keywords
      const input = `Intro\n\n${signatureParagraph}\n\nOutro`;
      const result = toggleModifierInText(input, 'quality');
      expect(result.action).toBe('removed');
      expect(result.nextText).toBe('Intro\n\nOutro');
    });

    it('does not treat a single-keyword paragraph as active; it keeps it and appends canonical', () => {
      const input = 'Please use active voice.\n\nThanks.';
      const result = toggleModifierInText(input, 'clear');
      expect(result.action).toBe('added');
      expect(result.nextText).toBe(`${input}\n\n${MODIFIERS.clear}`);
    });

    it('removes all matching paragraphs for that type (canonical and signature) if both exist', () => {
      const signatureParagraph = 'Use perfect grammar and no jargon.'; // 2/3 keywords
      const input = ['A', MODIFIERS.clear, signatureParagraph, 'B'].join('\n\n');
      const result = toggleModifierInText(input, 'clear');
      expect(result).toEqual({ nextText: 'A\n\nB', action: 'removed' });
    });

    it('returns an empty string when removing the only modifier paragraph', () => {
      const result = toggleModifierInText(MODIFIERS.tone, 'tone');
      expect(result).toEqual({ nextText: '', action: 'removed' });
    });
  });
});
