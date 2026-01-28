import { useEffect, useRef, useState } from 'react';
import { Sidebar } from '../sidebar';
import { ModelResponse } from '../model-response';
import { WinnerButton } from '../winner-button';
import { PromptEditor } from '../prompt-editor';
import { typewriterEffect } from '../../utils/typewriter';
import type { DraftPrompt, Prompt } from './types';
import { graphql, useLazyLoadQuery } from 'react-relay';
import type { sidebar_prompts_fragment$key } from '../sidebar/__generated__/sidebar_prompts_fragment.graphql';
import type { layoutQuery as LayoutQueryType } from './__generated__/layoutQuery.graphql';
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

const LayoutQuery = graphql`
  query layoutQuery {
    saved_promptsCollection(first: 50) {
      pageInfo {
        hasNextPage
      }
      edges {
        node {
          ...sidebar_prompts_fragment
        }
      }
    }
  }
`;

export function Layout() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [canSave, setCanSave] = useState<boolean>(false);
  const [instructions, setInstructions] = useState<string>('');
  const [modelAResponse, setModelAResponse] = useState<string>('');
  const [savedPrompts, setSavedPrompts] = useState<DraftPrompt[]>(() =>
    JSON.parse(localStorage.getItem('savedPrompts') || '[]')
  );

  const data = useLazyLoadQuery<LayoutQueryType>(LayoutQuery, {});
  const nodes: sidebar_prompts_fragment$key =
    data.saved_promptsCollection?.edges?.map((e) => e.node) ?? [];

  console.log('data', data);

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
      <Sidebar promptNodesRef={nodes} handleLoadPrompt={handleLoadPrompt} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <PromptEditor
          prompt={{
            id: crypto.randomUUID(),
            title,
            instructions,
            icon: winner !== null && winner === 'llama' ? '🦙' : '🐍',
            winner,
          }}
          isLoading={isLoading}
          handleTestPrompt={handleTestPrompt}
          handleClear={handleClear}
          applyModifier={applyModifier}
          canSave={canSave}
          handleSave={handleSave}
          setTitle={setTitle}
          setInstructions={setInstructions}
        />
        {/* Model Responses - Side by Side */}
        <section className="flex-1 grid grid-cols-2 min-h-0">
          {/* Model A */}
          <ModelResponse
            modelName="Model A - Llama3.1-8b"
            response={modelAResponse}
            winnerButton={
              <WinnerButton
                model="qwen"
                onClick={() => handleWinner('llama')}
                isWinner={winner === 'llama'}
              />
            }
          />
          <ModelResponse
            modelName="Model B - Qwen2.5-7b"
            response={modelBResponse}
            winnerButton={
              <WinnerButton
                model="qwen"
                onClick={() => handleWinner('qwen')}
                isWinner={winner === 'qwen'}
              />
            }
          />
        </section>
      </main>
    </div>
  );
}
