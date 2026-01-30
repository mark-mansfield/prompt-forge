import { useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

import { Sidebar } from './index';
import type { Prompt } from '../layout/types';
import type { sidebar_prompts_fragment$key } from './__generated__/sidebar_prompts_fragment.graphql';

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
        <Sidebar promptNodesRef={sidebarProps.promptNodesRef} handleLoadPrompt={sidebarProps.handleLoadPrompt} />
      </div>

      {/* Mobile sidebar sheet */}
      {isOpen ? (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Sidebar">
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

