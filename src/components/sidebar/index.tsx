import { AnvilIcon } from 'lucide-react';
import type { Prompt } from '../layout/types';
import { useFragment, graphql } from 'react-relay';
import type { sidebar_prompts_fragment$key } from './__generated__/sidebar_prompts_fragment.graphql';
import { Tabs } from './tabs';
import { promptFromSidebarNode } from '../../domain/promptAdapter';
const sidebarPromptsFragment = graphql`
  fragment sidebar_prompts_fragment on saved_prompts @relay(plural: true) {
    id
    title
    icon
    instructions
    winner
  }
`;

type Props = {
  promptNodesRef: sidebar_prompts_fragment$key;
  handleLoadPrompt: (prompt: Prompt) => void;
};

export function Sidebar({ promptNodesRef, handleLoadPrompt }: Props) {
  const prompts = useFragment(sidebarPromptsFragment, promptNodesRef);

  return (
    <aside className="w-68 border-r border-slate-700 flex flex-col">
      <div className="p-4 flex items-center gap-2 border-b border-slate-700">
        <AnvilIcon size={24} />
        <h1 className="text-2xl font-bold">PromptForge</h1>
      </div>
      <Tabs />
      <div className="p-4">
        <h2 className="text-sm font-medium text-slate-400 mb-3">Recent prompts</h2>
        <ul className="space-y-2">
          {prompts.map((p) => (
            <li key={p.id} className="text-sm text-slate-300 hover:text-white cursor-pointer">
              <button
                className="w-full flex gap-1 text-left p-2 rounded-md hover:bg-blue-500/30"
                onClick={() => handleLoadPrompt(promptFromSidebarNode(p))}
              >
                <span className="w-4 h-4">{p.icon}</span>
                <span className="text-sm">{p.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
