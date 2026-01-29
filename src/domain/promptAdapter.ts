/**
 * Relay → Domain adapter
 *
 * Relay-generated types intentionally include forward-compatibility escape hatches,
 * e.g. enums become `"A" | "B" | "%future added value"`. This protects the app when
 * the backend schema evolves, but it means Relay "transport" types will rarely match
 * strict UI/domain models exactly.
 *
 * This module is the boundary: components should convert Relay data into domain models
 * here, so the rest of the UI can stay clean and strongly typed.
 *
 * Policy: FAIL FAST on schema drift. If the backend adds a new enum value, we throw
 * with a helpful error message so it’s obvious the UI needs an update.
 */

import type { Prompt, Winner } from '../components/layout/types';
import type {
  sidebar_prompts_fragment$data,
  winner_model,
} from '../components/sidebar/__generated__/sidebar_prompts_fragment.graphql';

export type SavedModelResponse = {
  model_id: string;
  response: string;
  created_at?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseModelResponses(value: unknown): SavedModelResponse[] {
  // Supabase GraphQL `JSON` can come through as:
  // - a JSON string (common when the DB column itself is textified JSON)
  // - already-parsed array/object (depending on resolver/serialization)
  let parsed: unknown = value;

  if (typeof parsed === 'string') {
    const trimmed = parsed.trim();
    if (!trimmed) return [];
    try {
      parsed = JSON.parse(trimmed) as unknown;
    } catch (err) {
      console.error('Failed to parse saved_prompts.model_responses JSON string:', err);
      return [];
    }
  }

  const items: unknown[] =
    Array.isArray(parsed) ? parsed : isRecord(parsed) && Array.isArray(parsed.items) ? parsed.items : [];

  const out: SavedModelResponse[] = [];
  for (const item of items) {
    if (!isRecord(item)) continue;
    const modelId = item.model_id;
    const response = item.response;
    const createdAt = item.created_at;
    if (typeof modelId !== 'string' || typeof response !== 'string') continue;
    out.push({
      model_id: modelId,
      response,
      created_at: typeof createdAt === 'string' ? createdAt : undefined,
    });
  }
  return out;
}

export function parseWinner(value: winner_model | null | undefined): Winner {
  if (value === 'llama' || value === 'qwen') return value;
  throw new Error(
    `Unsupported winner value from backend: ${String(value)}. ` +
      `Update the domain adapter in src/domain/promptAdapter.ts to handle the new enum value.`
  );
}

export function promptFromSidebarNode(node: sidebar_prompts_fragment$data[number]): Prompt {
  const id = String(node.id);
  if (!id) {
    throw new Error('Missing prompt id from backend (saved_prompts.id).');
  }
  return {
    id,
    title: node.title,
    instructions: node.instructions,
    icon: node.icon,
    winner: parseWinner(node.winner),
    modelResponses: parseModelResponses((node as any).model_responses),
  };
}

