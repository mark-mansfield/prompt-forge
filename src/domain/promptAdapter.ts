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
  };
}

