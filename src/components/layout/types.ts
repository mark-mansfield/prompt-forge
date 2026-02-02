export type Winner = 'llama' | 'gemini';

export type SavedModelResponse = {
  model_id: string;
  response: string;
  created_at?: string;
  /**
   * UI-only fields for streaming runs (not persisted today).
   */
  status?: 'idle' | 'streaming' | 'done' | 'error' | 'aborted';
  error?: string;
  usage?: {
    totalTokens?: number;
    inputTokens?: number;
    outputTokens?: number;
  };
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
export type DraftPrompt = Omit<Prompt, 'winner' | 'id'> & {
  winner: Winner | null;
};
