export type Winner = 'llama' | 'qwen';

/**
 * Domain model for a *saved* prompt (i.e. data we treat as canonical).
 * This intentionally matches the backend invariant that a winner always exists.
 */
export type Prompt = {
  id: string;
  title: string;
  instructions: string;
  icon: string;
  winner: Winner;
};

/**
 * UI/editor model. Drafts can exist before the user picks a winner.
 */
export type DraftPrompt = Omit<Prompt, 'winner'> & {
  winner: Winner | null;
};
