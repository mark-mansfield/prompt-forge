import { Save, Play, Trash2, Sparkles, Target, MessageSquare, CircleX, Square } from 'lucide-react';
import { useState } from 'react';

import { PromptEditorHeader } from './header';
import type { DraftPrompt } from '../layout/types';

type ModifierType = 'clear' | 'quality' | 'tone';

export const PromptEditor = ({
  prompt,
  handleTestPrompt,
  handleStop,
  handleClear,
  isLoading,
  canSave,
  canDelete,
  handleSave,
  handleDelete,
  setTitle,
  setInstructions,
  applyModifier,
  modifierTextByType,
  openSidebarButton,
}: {
  prompt: DraftPrompt;
  handleTestPrompt: () => void;
  handleStop: () => void;
  handleClear: () => void;
  isLoading: boolean;
  canSave: boolean;
  canDelete: boolean;
  handleSave: () => void;
  handleDelete: () => void;
  applyModifier: (type: ModifierType) => void;
  modifierTextByType: Record<ModifierType, string>;
  openSidebarButton?: React.ReactNode;
  setTitle: (title: string) => void;
  setInstructions: (instructions: string) => void;
}) => {
  const { title, instructions } = prompt;
  const [modifierAnnouncement, setModifierAnnouncement] = useState('');

  const announceModifier = (type: ModifierType) => {
    applyModifier(type);

    const label: Record<ModifierType, string> = {
      clear: 'Clarity',
      quality: 'Quality',
      tone: 'Tone',
    };

    // Force an aria-live update even if you click same modifier repeatedly.
    setModifierAnnouncement('');
    requestAnimationFrame(() => {
      setModifierAnnouncement(`${label[type]} modifier applied. ${modifierTextByType[type]}`);
    });
  };

  return (
    <section className="border-b border-slate-700 p-4 flex flex-col">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {modifierAnnouncement}
      </div>
      <div className="flex items-center justify-between py-2">
        <div className="flex items-start gap-2">
          <PromptEditorHeader />
        </div>
        <div className="flex gap-2">
          {openSidebarButton}
          <button
            aria-label="Test prompt"
            title="Test prompt"
            onClick={handleTestPrompt}
            disabled={!instructions?.trim() || isLoading}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Play className="w-3 h-3" />
            {isLoading ? 'Testing...' : 'Run'}
          </button>
          <button
            aria-label="Stop"
            title="Stop"
            onClick={handleStop}
            disabled={!isLoading}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Square className="w-3 h-3" />
            Stop
          </button>
          <button
            aria-label="Clear prompt"
            title="Clear prompt"
            onClick={handleClear}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm flex items-center gap-1"
          >
            <CircleX className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>
      <div className="flex gap-2 p-2 bg-white/5  mb-6">
        <button
          title="Clarity"
          onClick={() => announceModifier('clear')}
          className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 flex items-center gap-1"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          Clarity
        </button>
        <button
          title="Quality"
          onClick={() => announceModifier('quality')}
          className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded hover:bg-emerald-500/30 flex items-center gap-1"
        >
          <Target className="w-4 h-4" aria-hidden="true" />
          Quality
        </button>
        <button
          title="Tone"
          onClick={() => announceModifier('tone')}
          className="px-4 py-2 bg-orange-500/20 text-orange-300 rounded hover:bg-orange-500/30 flex items-center gap-1"
        >
          <MessageSquare className="w-4 h-4" aria-hidden="true" />
          Tone
        </button>
      </div>
      <input
        type="text"
        placeholder="Prompt title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-3 mb-3 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 font-medium"
      />
      <div className="flex flex-col gap-4 py-2">
        <textarea
          placeholder="Enter your prompt here..."
          rows={6}
          value={instructions || ''}
          onChange={(e) => setInstructions(e.target.value)}
          className="flex-1 w-full p-3 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 resize-none focus:outline-none focus:border-slate-600"
        />

        <div className="w-full flex gap-2 justify-end">
          <button
            disabled={!canSave}
            onClick={handleSave}
            className="disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded flex items-center gap-1 shadow-lg"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            disabled={!canDelete}
            onClick={handleDelete}
            aria-label="Delete prompt"
            title="Delete prompt"
            className="disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded flex items-center gap-1 shadow-lg"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
};
