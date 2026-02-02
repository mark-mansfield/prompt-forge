export const MODIFIERS = {
  clear: 'Respond with perfect grammar, short sentences, active voice, no jargon.',
  quality: 'Be specific, comprehensive, include examples, cite reasoning.',
  tone: 'Match professional tone. Confident, direct, persuasive.',
};

export type ModifierType = keyof typeof MODIFIERS;

const MODIFIER_SIGNATURES: Record<ModifierType, { keywords: string[]; minMatches: number }> = {
  clear: { keywords: ['perfect grammar', 'active voice', 'no jargon'], minMatches: 2 },
  quality: { keywords: ['comprehensive', 'include examples', 'cite reasoning'], minMatches: 2 },
  tone: { keywords: ['professional tone', 'confident', 'persuasive'], minMatches: 2 },
};

function splitIntoParagraphs(text: string): string[] {
  const trimmed = text.replace(/\s+$/g, '');
  if (!trimmed) return [];
  return trimmed
    .split(/\n\s*\n+/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

function paragraphMatchesSignature(paragraph: string, type: ModifierType): boolean {
  const lower = paragraph.toLowerCase();
  const sig = MODIFIER_SIGNATURES[type];
  let hits = 0;
  for (const kw of sig.keywords) {
    if (lower.includes(kw)) hits += 1;
  }
  return hits >= sig.minMatches;
}

function paragraphIsCanonical(paragraph: string, type: ModifierType): boolean {
  return paragraph.trim() === MODIFIERS[type];
}

export function detectActiveModifiers(text: string): Set<ModifierType> {
  const paragraphs = splitIntoParagraphs(text);
  const active = new Set<ModifierType>();
  (Object.keys(MODIFIERS) as ModifierType[]).forEach((type) => {
    if (
      paragraphs.some((p) => paragraphIsCanonical(p, type) || paragraphMatchesSignature(p, type))
    ) {
      active.add(type);
    }
  });
  return active;
}

export function toggleModifierInText(
  text: string,
  type: ModifierType
): { nextText: string; action: 'added' | 'removed' } {
  const paragraphs = splitIntoParagraphs(text);
  const isActive = paragraphs.some(
    (p) => paragraphIsCanonical(p, type) || paragraphMatchesSignature(p, type)
  );

  if (isActive) {
    const remaining = paragraphs.filter(
      (p) => !(paragraphIsCanonical(p, type) || paragraphMatchesSignature(p, type))
    );
    const nextText = remaining.join('\n\n').trimEnd();
    return { nextText, action: 'removed' };
  }

  const trimmed = text.replace(/\s+$/g, '');
  const nextText = trimmed ? `${trimmed}\n\n${MODIFIERS[type]}` : MODIFIERS[type];
  return { nextText, action: 'added' };
}
