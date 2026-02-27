import { AnvilIcon, CheckIcon, SearchIcon, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Prompt } from '../layout/types';
import { Button } from '../ui/button';
import { useFragment, graphql, useLazyLoadQuery } from 'react-relay';
import type { sidebar_prompts_fragment$key } from './__generated__/sidebar_prompts_fragment.graphql';
import type { sidebarActiveTabQuery as SidebarActiveTabQueryType } from './__generated__/sidebarActiveTabQuery.graphql';
import { Tabs } from './tabs';
import { promptFromSidebarNode } from '../../domain/promptAdapter';

/** True if query chars appear in text in order (case-insensitive). */
function fuzzyMatch(query: string, text: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const t = text.toLowerCase();
  let j = 0;
  for (let i = 0; i < t.length && j < q.length; i++) {
    if (t[i] === q[j]) j++;
  }
  return j === q.length;
}

const sidebarPromptsFragment = graphql`
  fragment sidebar_prompts_fragment on saved_prompts @relay(plural: true) {
    id
    title
    icon
    instructions
    winner
    model_responses
  }
`;

const sidebarActiveTabQuery = graphql`
  query sidebarActiveTabQuery {
    activeTabId
  }
`;

type Props = {
  promptNodesRef: sidebar_prompts_fragment$key;
  handleLoadPrompt: (prompt: Prompt) => void;
};

export function Sidebar({ promptNodesRef, handleLoadPrompt }: Props) {
  const { activeTabId } = useLazyLoadQuery<SidebarActiveTabQueryType>(sidebarActiveTabQuery, {});
  const prompts = useFragment(sidebarPromptsFragment, promptNodesRef);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchQuery(searchQuery), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const applySearchNow = () => setDebouncedSearchQuery(searchQuery.trim());
  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
  };

  const winnerToModelId = (winner: string) => {
    if (winner === 'llama') return 'llama-3.1-8b-instant';
    if (winner === 'gemini') return 'gemini-2.5-flash';
    return winner;
  };

  // NOTE: Tabs *appear* model-id keyed (`llama-3.1-8b-instant`, `gemini-2.5-flash`),
  // but filtering is effectively *provider-level* via `winner` (mapped by `winnerToModelId`).
  // This means all Gemini winners (including different Google model variants like Flash/Flash‑Lite)
  // show up under the single "Gemini" tab.
  const tabFilteredPrompts =
    activeTabId === 'all'
      ? prompts
      : prompts.filter((p) => winnerToModelId(String(p.winner)) === activeTabId);

  const visiblePrompts =
    debouncedSearchQuery.trim() === ''
      ? tabFilteredPrompts
      : tabFilteredPrompts.filter((p) => fuzzyMatch(debouncedSearchQuery, p.title));

  return (
    <aside className="w-full h-full md:w-68 border-r border-slate-700 flex flex-col overflow-y-auto">
      <div className="sticky top-0 z-50 bg-slate-900">
        <div className="p-4 flex items-center gap-2 border-b border-slate-700">
          <AnvilIcon size={24} />
          <h1 className="text-2xl font-bold">PromptForge</h1>
        </div>
        <Tabs activeTabId={activeTabId} />
        <div className="px-4 pb-3 pt-4 w-full">
          <div className="relative w-full">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearchNow();
              }}
              className="w-full pl-8 pr-9 py-2 rounded-md bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 text-sm"
              aria-label="Search prompts"
            />
            {searchQuery.trim() !== '' && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700"
                aria-label="Clear search"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="p-4 mt-4">
        <h2 className="text-sm font-medium text-slate-400 mb-3">Recent prompts</h2>
        <ul className="space-y-2">
          {visiblePrompts.map((p) => (
            <li key={p.id} className="text-sm text-slate-300 hover:text-white cursor-pointer">
              <Button
                variant={'ghost'}
                className={`w-full justify-start gap-1 px-3 hover:bg-blue-500/30 text-white hover:text-white min-w-0 ${selectedPromptId === p.id ? 'bg-blue-500/30' : ''}`}
                onClick={() => {
                  handleLoadPrompt(promptFromSidebarNode(p));
                  setSelectedPromptId(p.id);
                }}
              >
                <span className="w-4 h-4 shrink-0">{p.icon}</span>
                <span className="text-sm truncate min-w-0">{p.title}</span>
                {selectedPromptId === p.id && <CheckIcon className="shrink-0" />}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
