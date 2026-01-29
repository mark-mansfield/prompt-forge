import { useEffect, useRef, useState } from 'react';
import { Sidebar } from '../sidebar';
import { ModelResponse } from '../model-response';
import { WinnerButton } from '../winner-button';
import { PromptEditor } from '../prompt-editor';
import { typewriterEffect } from '../../utils/typewriter';
import type { Prompt } from './types';
import { commitMutation, graphql, useLazyLoadQuery, useRelayEnvironment } from 'react-relay';
import { ConnectionHandler, type RecordSourceSelectorProxy } from 'relay-runtime';
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
    saved_promptsCollection(first: 50) @connection(key: "Layout__saved_promptsCollection") {
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

export const SavePromptMutation = graphql`
  mutation layoutSavePromptMutation($object: saved_promptsInsertInput!) {
    insertIntosaved_promptsCollection(objects: [$object]) {
      records {
        id
        title
        icon
        instructions
        winner
      }
    }
  }
`;

export const DeletePromptMutation = graphql`
  mutation layoutDeletePromptMutation($filter: saved_promptsFilter!) {
    deleteFromsaved_promptsCollection(filter: $filter) {
      affectedCount
    }
  }
`;

export function Layout() {
  const environment = useRelayEnvironment();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [canSave, setCanSave] = useState<boolean>(false);
  const [instructions, setInstructions] = useState<string>('');
  const [modelAResponse, setModelAResponse] = useState<string>('');

  const data = useLazyLoadQuery<LayoutQueryType>(LayoutQuery, {});
  const nodes: sidebar_prompts_fragment$key =
    data.saved_promptsCollection?.edges?.map((e) => e.node) ?? [];

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

  function handleSave() {
    if (editingId) {
      // We only support creating new prompts for now.
      // Updating an existing saved prompt should use `updatesaved_promptsCollection`.
      console.warn('Saving edits is not implemented yet (editingId present).');
      return;
    }
    if (!title.trim()) return;
    if (!instructions.trim()) return;

    const icon = winner !== null && winner === 'llama' ? '🦙' : '🐍';

    commitMutation(environment, {
      mutation: SavePromptMutation,
      variables: {
        object: {
          title,
          instructions,
          icon,
          winner,
          // NOTE: we intentionally do NOT send id/nodeId/created_at/updated_at
          // since those are Supabase-managed (db defaults/triggers).
        },
      },
      updater: (store) => {
        const payload = store.getRootField('insertIntosaved_promptsCollection');
        const inserted = payload?.getLinkedRecords('records')?.[0];
        if (!inserted) return;

        const root = store.getRoot();
        const connection = ConnectionHandler.getConnection(root, 'Layout__saved_promptsCollection');

        if (!connection) return;

        const edge = ConnectionHandler.createEdge(store, connection, inserted, 'saved_promptsEdge');
        ConnectionHandler.insertEdgeBefore(connection, edge);
      },
      onCompleted: () => {
        setCanSave(false);
      },
      onError: (err) => {
        console.error('Failed to save prompt:', err);
      },
    });
  }

  function handleDeletePrompt() {
    if (!editingId) return;

    const removeFromPromptsConnection = (store: RecordSourceSelectorProxy, id: string) => {
      const root = store.getRoot();
      const connection = ConnectionHandler.getConnection(root, 'Layout__saved_promptsCollection');
      if (!connection) return;
      ConnectionHandler.deleteNode(connection, id);
    };

    commitMutation(environment, {
      mutation: DeletePromptMutation,
      variables: { filter: { id: { eq: editingId } } },
      optimisticUpdater: (store) => {
        removeFromPromptsConnection(store, editingId);
      },
      updater: (store) => {
        removeFromPromptsConnection(store, editingId);
      },
      onCompleted: () => {
        handleClear();
      },
      onError: (err) => {
        console.error('Failed to delete prompt:', err);
      },
    });
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
          canSave={canSave && winner !== null}
          handleSave={handleSave}
          handleDelete={handleDeletePrompt}
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
