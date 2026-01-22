import { useEffect, useRef, useState } from 'react';
import { FileText, Play, Trash2, Save, Sparkles, Target, MessageSquare, Crown } from 'lucide-react';

type Prompt = {
  id: string;
  title: string;
  instructions: string;
  icon: string;
  winner: 'llama' | 'qwen' | null;
};
// TODO remove this after we implemnt the actual model respones
const MOCK_RESPONSES = {
  modelA: `Subject: Transform Your AI Workflow with PromptForge

Hi [Name],

I noticed your team is shipping AI-powered features at [Company]. Are you spending hours tweaking prompts across different models?

PromptForge lets you A/B test prompts against multiple LLMs in real-time. Our customers cut prompt iteration time by 60%.

Would love to show you a 10-min demo this week.

Best,
[Your name]`,
  modelB: `Subject: Quick question about your AI stack

Hey [Name],

Saw [Company]'s recent launch — impressive work on the AI features.

Curious: how do you currently compare prompt performance across models? We built PromptForge specifically for teams like yours who need to iterate fast.

One click → test against Llama, Qwen, GPT, Claude. See what wins.

Free to chat Thursday?

Cheers,
[Your name]`,
};

const MODIFIERS = {
  clear: 'Respond with perfect grammar, short sentences, active voice, no jargon.',
  quality: 'Be specific, comprehensive, include examples, cite reasoning.',
  tone: 'Match professional tone. Confident, direct, persuasive.',
};

export function SplitLayout() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [canSave, setCanSave] = useState<boolean>(false);
  const [instructions, setInstructions] = useState<string>('');
  const [modelAResponse, setModelAResponse] = useState<string>('');
  const [savedPrompts, setSavedPrompts] = useState<Prompt[]>(() =>
    JSON.parse(localStorage.getItem('savedPrompts') || '[]')
  );

  const [modelBResponse, setModelBResponse] = useState('');
  const [winner, setWinner] = useState<'llama' | 'qwen' | null>(null);

  function applyModifier(type: keyof typeof MODIFIERS) {
    setInstructions((prev) => prev + '\n\n' + MODIFIERS[type]);
  }

  function handleWinner(model: 'llama' | 'qwen') {
    setWinner(model);
  }

  const [isLoading, setIsLoading] = useState(false);
  const modelAIndexRef = useRef(0);
  const modelBIndexRef = useRef(0);

  const startDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkDoneIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const modelAIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const modelBIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function cleanupTimers() {
    if (startDelayTimeoutRef.current !== null) {
      clearTimeout(startDelayTimeoutRef.current);
      startDelayTimeoutRef.current = null;
    }
    if (checkDoneIntervalRef.current !== null) {
      clearInterval(checkDoneIntervalRef.current);
      checkDoneIntervalRef.current = null;
    }
    if (modelAIntervalRef.current !== null) {
      clearInterval(modelAIntervalRef.current);
      modelAIntervalRef.current = null;
    }
    if (modelBIntervalRef.current !== null) {
      clearInterval(modelBIntervalRef.current);
      modelBIntervalRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      cleanupTimers();
    };
  }, []);

  const typewriterEffect = (
    fullText: string,
    indexRef: React.MutableRefObject<number>,
    setter: React.Dispatch<React.SetStateAction<string>>,
    speed: number = 15
  ) => {
    const interval = setInterval(() => {
      if (indexRef.current < fullText.length) {
        setter(fullText.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return interval;
  };

  // TODO use relay to test the prompt
  const handleTestPrompt = () => {
    if (!instructions.trim() || isLoading) return;

    cleanupTimers();
    setIsLoading(true);
    setModelAResponse('');
    setModelBResponse('');
    modelAIndexRef.current = 0;
    modelBIndexRef.current = 0;

    startDelayTimeoutRef.current = setTimeout(() => {
      modelAIntervalRef.current = typewriterEffect(
        MOCK_RESPONSES.modelA,
        modelAIndexRef,
        setModelAResponse,
        12
      );
      modelBIntervalRef.current = typewriterEffect(
        MOCK_RESPONSES.modelB,
        modelBIndexRef,
        setModelBResponse,
        18
      );

      checkDoneIntervalRef.current = setInterval(() => {
        if (
          modelAIndexRef.current >= MOCK_RESPONSES.modelA.length &&
          modelBIndexRef.current >= MOCK_RESPONSES.modelB.length
        ) {
          setIsLoading(false);
          setCanSave(true);
          cleanupTimers();
        }
      }, 100);
    }, 500);
  };

  const handleClear = () => {
    cleanupTimers();
    setEditingId(null);
    setTitle('');
    setInstructions('');
    setModelAResponse('');
    setModelBResponse('');
    modelAIndexRef.current = 0;
    modelBIndexRef.current = 0;
    setIsLoading(false);
    setWinner(null);
    setCanSave(false);
  };

  // TODO use relay to save the prompt
  function handleSave() {
    const icon = winner !== null && winner === 'llama' ? '🦙' : '🐍';

    const updated = editingId
      ? savedPrompts.map((p) =>
          p.id === editingId ? { ...p, title, instructions, icon, winner } : p
        )
      : [...savedPrompts, { id: crypto.randomUUID(), title, instructions, icon, winner }];

    localStorage.setItem('savedPrompts', JSON.stringify(updated));
    setSavedPrompts(updated);
  }

  // get the prompt from the relay cache
  function handleLoadPrompt(prompt: Prompt) {
    setEditingId(prompt.id);
    setTitle(prompt.title);
    setInstructions(prompt.instructions);
    setWinner(prompt.winner);
    setModelAResponse('');
    setModelBResponse('');
    modelAIndexRef.current = 0;
    modelBIndexRef.current = 0;
    setIsLoading(false);
  }

  return (
    <div className="h-screen flex bg-slate-900 text-white">
      {/* Left Sidebar - Saved Prompts */}
      <aside className="w-56 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="p-4">
          <h2 className="text-sm font-medium text-slate-400 mb-3">Saved prompts</h2>
          <ul className="space-y-2">
            {savedPrompts.map((p) => (
              <li
                key={p.id}
                className="text-sm text-slate-300 hover:text-white cursor-pointer py-1"
              >
                <button onClick={() => handleLoadPrompt(p)}>{p.title}</button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Prompt Editor */}
        <section className="border-b border-slate-700 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Prompt editor</h2>
            <div className="flex gap-2">
              <button
                onClick={handleTestPrompt}
                disabled={!instructions?.trim() || isLoading}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Play className="w-3 h-3" />
                {isLoading ? 'Testing...' : 'Run'}
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>
          <div className="flex gap-2 p-2 bg-white/5  mb-6">
            <button
              onClick={() => applyModifier('clear')}
              className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4" />
              Clarity
            </button>
            <button
              onClick={() => applyModifier('quality')}
              className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded hover:bg-emerald-500/30 flex items-center gap-1"
            >
              <Target className="w-4 h-4" />
              Quality
            </button>
            <button
              onClick={() => applyModifier('tone')}
              className="px-4 py-2 bg-orange-500/20 text-orange-300 rounded hover:bg-orange-500/30 flex items-center gap-1"
            >
              <MessageSquare className="w-4 h-4" />
              Tone
            </button>
            <button
              disabled={!canSave}
              onClick={handleSave}
              className="disabled:opacity-50 disabled:cursor-not-allowed ml-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded flex items-center gap-1 shadow-lg"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
          <input
            type="text"
            placeholder="Prompt title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 mb-3 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-slate-600 font-medium"
          />
          <textarea
            placeholder="Enter your prompt here..."
            rows={6}
            value={instructions || ''}
            onChange={(e) => setInstructions(e.target.value)}
            className="flex-1 w-full p-3 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 resize-none focus:outline-none focus:border-slate-600"
          />
        </section>

        {/* Model Responses - Side by Side */}
        <section className="flex-1 grid grid-cols-2 min-h-0">
          {/* Model A */}
          <div className="border-r border-slate-700 flex flex-col">
            <div className="p-3 border-b border-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <h3 className="text-sm font-medium">Model A</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto text-sm text-slate-300 whitespace-pre-wrap">
              {modelAResponse || (
                <span className="text-slate-500">Response will appear here...</span>
              )}
            </div>
            <button
              onClick={() => handleWinner('llama')}
              className="p-4 font-bold text-lg w-full transition-all duration-200 bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center gap-2"
            >
              {winner === 'llama' ? (
                <>
                  <Crown className="w-5 h-5 text-yellow-400" />
                  WINNER
                </>
              ) : (
                'Make llama Winner'
              )}
            </button>
          </div>

          {/* Model B */}
          <div className="flex flex-col">
            <div className="p-3 border-b border-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              <h3 className="text-sm font-medium">Model B</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto text-sm text-slate-300 whitespace-pre-wrap">
              {modelBResponse || (
                <span className="text-slate-500">Response will appear here...</span>
              )}
            </div>
            <button
              onClick={() => handleWinner('qwen')}
              className="p-4 font-bold text-lg w-full transition-all duration-200 bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center gap-2"
            >
              {winner === 'qwen' ? (
                <>
                  <Crown className="w-5 h-5 text-yellow-400" />
                  WINNER
                </>
              ) : (
                'Make qwen Winner'
              )}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
