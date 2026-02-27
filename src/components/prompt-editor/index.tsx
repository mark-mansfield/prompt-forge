import { Save, Play, Trash2, Sparkles, Target, MessageSquare, CircleX, Square } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../ui/button';
import { PromptEditorHeader } from './header';
import type { DraftPrompt } from '../layout/types';

type ModifierType = 'clear' | 'quality' | 'tone';
type ModifierAction = 'added' | 'removed';

export const PromptEditor = ({
  prompt,
  handleExecutePrompt,
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
  activeModifiers,
  openSidebarButton,
}: {
  prompt: DraftPrompt;
  handleExecutePrompt: () => void;
  handleStop: () => void;
  handleClear: () => void;
  isLoading: boolean;
  canSave: boolean;
  canDelete: boolean;
  handleSave: () => void;
  handleDelete: () => void;
  applyModifier: (type: ModifierType) => ModifierAction;
  modifierTextByType: Record<ModifierType, string>;
  activeModifiers?: ModifierType[];
  openSidebarButton?: React.ReactNode;
  setTitle: (title: string) => void;
  setInstructions: (instructions: string) => void;
}) => {
  const { title, instructions } = prompt;
  const [modifierAnnouncement, setModifierAnnouncement] = useState('');
  const activeSet = new Set(activeModifiers ?? []);

  const announceModifier = (type: ModifierType) => {
    const action = applyModifier(type);

    const label: Record<ModifierType, string> = {
      clear: 'Clarity',
      quality: 'Quality',
      tone: 'Tone',
    };

    // Force an aria-live update even if you click same modifier repeatedly.
    setModifierAnnouncement('');
    requestAnimationFrame(() => {
      if (action === 'removed') {
        setModifierAnnouncement(`${label[type]} modifier removed.`);
        return;
      }
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
          <Button
            variant="secondary"
            size="sm"
            aria-label="Test prompt"
            title="Test prompt"
            onClick={handleExecutePrompt}
            disabled={!instructions?.trim() || isLoading}
            className="bg-slate-700 hover:bg-slate-600 text-white"
          >
            <Play className="w-3 h-3" />
            {isLoading ? 'Testing...' : 'Run'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            aria-label="Stop"
            title="Stop"
            onClick={handleStop}
            disabled={!isLoading}
            className="bg-slate-700 hover:bg-slate-600 text-white"
          >
            <Square className="w-3 h-3" />
            Stop
          </Button>
          <Button
            variant="secondary"
            size="sm"
            aria-label="Clear prompt"
            title="Clear prompt"
            onClick={handleClear}
            className="bg-slate-700 hover:bg-slate-600 text-white"
          >
            <CircleX className="w-3 h-3" />
            Clear
          </Button>
        </div>
      </div>
      <div className="flex gap-2 p-2 bg-white/5  mb-6">
        <Button
          variant="outline"
          size="sm"
          title="Clarity"
          onClick={() => announceModifier('clear')}
          aria-pressed={activeSet.has('clear')}
          className={
            activeSet.has('clear')
              ? 'bg-blue-500/30 text-blue-200 ring-1 ring-blue-300/40 border-0 hover:bg-blue-500/30'
              : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-0'
          }
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          Clarity
        </Button>
        <Button
          variant="outline"
          size="sm"
          title="Quality"
          onClick={() => announceModifier('quality')}
          aria-pressed={activeSet.has('quality')}
          className={
            activeSet.has('quality')
              ? 'bg-emerald-500/30 text-emerald-200 ring-1 ring-emerald-300/40 border-0 hover:bg-emerald-500/30'
              : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-0'
          }
        >
          <Target className="w-4 h-4" aria-hidden="true" />
          Quality
        </Button>
        <Button
          variant="outline"
          size="sm"
          title="Tone"
          onClick={() => announceModifier('tone')}
          aria-pressed={activeSet.has('tone')}
          className={
            activeSet.has('tone')
              ? 'bg-orange-500/30 text-orange-200 ring-1 ring-orange-300/40 border-0 hover:bg-orange-500/30'
              : 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border-0'
          }
        >
          <MessageSquare className="w-4 h-4" aria-hidden="true" />
          Tone
        </Button>
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
          className="flex-1 min-h-32 w-full p-3 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 resize-y focus:outline-none focus:border-slate-600"
        />

        <div className="w-full flex gap-2 justify-end">
          <Button
            disabled={!canSave}
            onClick={handleSave}
            className="bg-teal-600 hover:bg-teal-500 text-white shadow-lg"
          >
            <Save className="w-4 h-4" />
            Save
          </Button>
          <Button
            variant="destructive"
            disabled={!canDelete}
            onClick={handleDelete}
            aria-label="Delete prompt"
            title="Delete prompt"
            className="bg-red-600 hover:bg-red-500"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
};
