import { useState, useRef } from 'react';
import { FileText, Play, Trash2 } from 'lucide-react';

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

const SAVED_PROMPTS = [
  { id: 1, title: 'Cold email to CTOs' },
  { id: 2, title: 'Product description' },
  { id: 3, title: 'Support response' },
];

export function SplitLayout() {
  const [prompt, setPrompt] = useState('');
  const [modelAResponse, setModelAResponse] = useState('');
  const [modelBResponse, setModelBResponse] = useState('');
  const [winner, setWinner] = useState<'llama' | 'qwen' | null>(null);

  function handleWinner(model) {
    setWinner(model);
  }
  const [isLoading, setIsLoading] = useState(false);
  const modelAIndexRef = useRef(0);
  const modelBIndexRef = useRef(0);

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

  const handleTestPrompt = () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setModelAResponse('');
    setModelBResponse('');
    modelAIndexRef.current = 0;
    modelBIndexRef.current = 0;

    setTimeout(() => {
      typewriterEffect(MOCK_RESPONSES.modelA, modelAIndexRef, setModelAResponse, 12);
      typewriterEffect(MOCK_RESPONSES.modelB, modelBIndexRef, setModelBResponse, 18);

      const checkDone = setInterval(() => {
        if (
          modelAIndexRef.current >= MOCK_RESPONSES.modelA.length &&
          modelBIndexRef.current >= MOCK_RESPONSES.modelB.length
        ) {
          setIsLoading(false);
          clearInterval(checkDone);
        }
      }, 100);
    }, 500);
  };

  const handleClear = () => {
    setPrompt('');
    setModelAResponse('');
    setModelBResponse('');
    modelAIndexRef.current = 0;
    modelBIndexRef.current = 0;
    setIsLoading(false);
  };

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
            {SAVED_PROMPTS.map((p) => (
              <li
                key={p.id}
                className="text-sm text-slate-300 hover:text-white cursor-pointer py-1"
              >
                {p.title}
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
                disabled={!prompt.trim() || isLoading}
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
          <textarea
            placeholder="Enter your prompt here..."
            rows={6}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
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
              className="p-4 font-bold text-lg w-full transition-all duration-200 bg-white/10 hover:bg-white/20 border border-white/20"
            >
              {winner === 'llama' ? '👑 WINNER' : 'Make llama Winner'}
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
              className="p-4 font-bold text-lg w-full transition-all duration-200 bg-white/10 hover:bg-white/20 border border-white/20"
            >
              {winner === 'qwen' ? '👑 WINNER' : 'Make qwen Winner'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
