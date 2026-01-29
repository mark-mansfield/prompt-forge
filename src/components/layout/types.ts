export type Winner = 'llama' | 'qwen';

export type SavedModelResponse = {
  model_id: string;
  response: string;
  created_at?: string;
};

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
  modelResponses: SavedModelResponse[];
};

/**
 * UI/editor model. Drafts can exist before the user picks a winner.
 */
export type DraftPrompt = Omit<Prompt, 'winner'> & {
  winner: Winner | null;
};
