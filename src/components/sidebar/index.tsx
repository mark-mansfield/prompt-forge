import { AnvilIcon } from 'lucide-react';
import type { Prompt } from '../layout/types';
import { useFragment, graphql, useLazyLoadQuery } from 'react-relay';
import type { sidebar_prompts_fragment$key } from './__generated__/sidebar_prompts_fragment.graphql';
import type { sidebarActiveTabQuery as SidebarActiveTabQueryType } from './__generated__/sidebarActiveTabQuery.graphql';
import { Tabs } from './tabs';
import { promptFromSidebarNode } from '../../domain/promptAdapter';
import { useRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';

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

  const winnerToModelId = (winner: string) => {
    if (winner === 'llama') return 'llama-3.1-8b-instant';
    if (winner === 'gemini') return 'gemini-2.5-flash';
    return winner;
  };

  // NOTE: Tabs *appear* model-id keyed (`llama-3.1-8b-instant`, `gemini-2.5-flash`),
  // but filtering is effectively *provider-level* via `winner` (mapped by `winnerToModelId`).
  // This means all Gemini winners (including different Google model variants like Flash/Flash‑Lite)
  // show up under the single "Gemini" tab.
  const visiblePrompts =
    activeTabId === 'all'
      ? prompts
      : prompts.filter((p) => winnerToModelId(String(p.winner)) === activeTabId);

  return (
    <aside className="w-full h-full md:w-68 border-r border-slate-700 flex flex-col overflow-y-auto">
      <div className="sticky top-0 z-50 bg-slate-900">
        <div className="p-4 flex items-center gap-2 border-b border-slate-700">
          <AnvilIcon size={24} />
          <h1 className="text-2xl font-bold">PromptForge</h1>
        </div>
        <Tabs activeTabId={activeTabId} />
      </div>
      <div className="p-4 mt-4">
        <h2 className="text-sm font-medium text-slate-400 mb-3">Recent prompts</h2>
        <ul className="space-y-2">
          {visiblePrompts.map((p) => (
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

type SidebarProps = {
  promptNodesRef: sidebar_prompts_fragment$key;
  handleLoadPrompt: (prompt: Prompt) => void;
};

export function SidebarWithSheet({
  isOpen,
  onClose,
  sidebarProps,
}: {
  isOpen: boolean;
  onClose: () => void;
  sidebarProps: SidebarProps;
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Focus close button on open
  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
  }, [isOpen]);

  const handleLoadPromptAndClose = (prompt: Prompt) => {
    sidebarProps.handleLoadPrompt(prompt);
    close();
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar
          promptNodesRef={sidebarProps.promptNodesRef}
          handleLoadPrompt={sidebarProps.handleLoadPrompt}
        />
      </div>

      {/* Mobile sidebar sheet */}
      {isOpen ? (
        <div
          className="md:hidden fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Sidebar"
        >
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div
            className="absolute left-0 top-0 h-full w-[85vw] max-w-sm bg-slate-900 border-r border-slate-700 transform transition-transform duration-200 translate-x-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close sidebar"
              className="absolute right-3 top-3 z-50 p-2 rounded bg-slate-800/80 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={close}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>

            <Sidebar
              promptNodesRef={sidebarProps.promptNodesRef}
              handleLoadPrompt={handleLoadPromptAndClose}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
