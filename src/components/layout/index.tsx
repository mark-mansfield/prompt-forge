import { useCallback, useMemo, useRef, useState } from 'react';
import { History } from 'lucide-react';
import { ModelResponse } from '../model-response';
import { WinnerButton } from '../winner-button';
import { PromptEditor } from '../prompt-editor';
import type { Prompt } from './types';
import { graphql, useLazyLoadQuery, useMutation } from 'react-relay';
import { useSavedPromptsConnectionUpdaters } from '../../relay/hooks/useSavedPromptsConnectionUpdaters';
import type { sidebar_prompts_fragment$key } from '../sidebar/__generated__/sidebar_prompts_fragment.graphql';
import type { layoutQuery as LayoutQueryType } from './__generated__/layoutQuery.graphql';
import type { layoutSavePromptMutation } from './__generated__/layoutSavePromptMutation.graphql';
import type { layoutUpdatePromptMutation } from './__generated__/layoutUpdatePromptMutation.graphql';
import type { layoutDeletePromptMutation } from './__generated__/layoutDeletePromptMutation.graphql';
import { toast } from 'sonner';
import { SidebarWithSheet } from '../sidebar/SidebarWithSheet';

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

export const UpdatePromptMutation = graphql`
  mutation layoutUpdatePromptMutation(
    $filter: saved_promptsFilter!
    $set: saved_promptsUpdateInput!
  ) {
    updatesaved_promptsCollection(filter: $filter, set: $set) {
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
  const {
    addPromptToSidebarConnection,
    updatePromptInSidebarConnection,
    removePromptFromSidebarConnection,
  } = useSavedPromptsConnectionUpdaters();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [modelResponses, setModelResponses] = useState<Prompt['modelResponses']>([]);
  const [lastSaved, setLastSaved] = useState<{
    title: string;
    instructions: string;
    winner: 'llama' | 'qwen' | null;
  } | null>(null);

  const data = useLazyLoadQuery<LayoutQueryType>(LayoutQuery, {});
  const nodes: sidebar_prompts_fragment$key =
    data.saved_promptsCollection?.edges?.map((e) => e.node) ?? [];

  const [winner, setWinner] = useState<'llama' | 'qwen' | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const [commitSavePrompt, isSaveInFlight] =
    useMutation<layoutSavePromptMutation>(SavePromptMutation);
  const [commitUpdatePrompt, isUpdateInFlight] =
    useMutation<layoutUpdatePromptMutation>(UpdatePromptMutation);
  const [commitDeletePrompt, isDeleteInFlight] =
    useMutation<layoutDeletePromptMutation>(DeletePromptMutation);

  const isMutating = isSaveInFlight || isUpdateInFlight || isDeleteInFlight;
  const isValid = Boolean(title.trim()) && Boolean(instructions.trim());
  const isDirty =
    lastSaved === null
      ? Boolean(title.trim() || instructions.trim() || winner !== null)
      : title !== lastSaved.title ||
        instructions !== lastSaved.instructions ||
        winner !== lastSaved.winner;

  const canSavePrompt = isValid && isDirty && winner !== null && !isMutating;
  const canDeletePrompt = Boolean(editingId) && !isMutating;

  function applyModifier(type: keyof typeof MODIFIERS) {
    setInstructions((prev) => prev + '\n\n' + MODIFIERS[type]);
  }

  function handleWinner(model: 'llama' | 'qwen') {
    setWinner(model);
  }

  const [isLoading, setIsLoading] = useState(false);

  const handleTestPrompt = async () => {
    if (isLoading) return;
    if (!instructions.trim()) return;
    setIsLoading(true);

    try {
      const prompt = instructions.trim();

      const call = async (provider: 'groq' | 'google') => {
        const res = await fetch('/.netlify/functions/llm', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include', // send gate cookie
          body: JSON.stringify({ provider, prompt }),
        });

        const data = (await res.json().catch(() => null)) as unknown;
        if (!res.ok) {
          const msg =
            typeof (data as { error?: unknown } | null)?.error === 'string'
              ? (data as { error: string }).error
              : res.statusText;
          throw new Error(`${provider} request failed (${res.status}): ${msg}`);
        }
        return data;
      };

      const providers = ['groq', 'google'] as const;
      const results = await Promise.allSettled(providers.map((p) => call(p)));

      let anySucceeded = false;
      results.forEach((r, idx) => {
        const provider = providers[idx];
        if (r.status === 'fulfilled') {
          anySucceeded = true;
          console.log(`LLM ${provider}:`, r.value);
        } else {
          console.error(`LLM ${provider} failed:`, r.reason);
        }
      });

      if (anySucceeded) {
        toast.success('LLM response(s) logged to console');
      } else {
        toast.error('LLM test failed (see console)');
      }
    } catch (err) {
      console.error('LLM test failed:', err);
      toast.error('LLM test failed (see console)');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setEditingId(null);
    setTitle('');
    setInstructions('');
    setModelResponses([]);
    setWinner(null);
    setLastSaved(null);
  };

  function handleSave() {
    if (!isValid) return;
    if (winner === null) return;
    if (isMutating) return;

    const icon = winner === 'llama' ? '🦙' : '🐍';

    if (editingId) {
      commitUpdatePrompt({
        variables: {
          filter: { id: { eq: editingId } },
          set: {
            title,
            instructions,
            icon,
            winner,
            // NOTE: do NOT send id/nodeId/created_at/updated_at
            // since those are Supabase-managed (db defaults/triggers).
          },
        },
        optimisticUpdater: (store) => {
          updatePromptInSidebarConnection(store, editingId, { title, instructions, icon, winner });
        },
        updater: (store) => {
          updatePromptInSidebarConnection(store, editingId, { title, instructions, icon, winner });
        },
        onCompleted: () => {
          setLastSaved({ title, instructions, winner });
          toast.success('Prompt updated');
        },
        onError: (err) => {
          console.error('Failed to update prompt:', err);
          toast.error('Failed to update prompt');
        },
      });
      return;
    }

    commitSavePrompt({
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
      optimisticUpdater: (store) => {
        addPromptToSidebarConnection(store);
      },
      updater: (store) => {
        addPromptToSidebarConnection(store);
      },
      onCompleted: (resp) => {
        const insertedId = resp.insertIntosaved_promptsCollection?.records?.[0]?.id;
        if (insertedId) {
          setEditingId(String(insertedId));
          setLastSaved({ title, instructions, winner });
        } else {
          toast.error('Saved, but could not determine prompt id');
        }
        toast.success('Prompt saved');
      },
      onError: (err) => {
        console.error('Failed to save prompt:', err);
        toast.error('Failed to save prompt');
      },
    });
  }

  function handleDeletePrompt() {
    if (!editingId) return;
    if (isMutating) return;

    commitDeletePrompt({
      variables: { filter: { id: { eq: editingId } } },
      optimisticUpdater: (store) => {
        removePromptFromSidebarConnection(store, editingId);
      },
      updater: (store) => {
        removePromptFromSidebarConnection(store, editingId);
      },
      onCompleted: () => {
        handleClear();
        toast.success('Prompt deleted');
      },
      onError: (err) => {
        console.error('Failed to delete prompt:', err);
        toast.error('Failed to delete prompt');
      },
    });
  }
  // get the prompt from the relay cache
  function handleLoadPrompt(prompt: Prompt) {
    setEditingId(prompt.id);
    setTitle(prompt.title);
    setInstructions(prompt.instructions);
    setWinner(prompt.winner);
    setLastSaved({ title: prompt.title, instructions: prompt.instructions, winner: prompt.winner });
    setModelResponses(prompt.modelResponses);
  }

  const openSidebar = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    setIsSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
    requestAnimationFrame(() => {
      previousFocusRef.current?.focus?.();
    });
  }, []);

  const hasPrompts = nodes.length > 0;

  const openSidebarButton = useMemo(() => {
    return (
      <button
        type="button"
        aria-label="Open sidebar"
        title={hasPrompts ? 'Open sidebar' : 'No prompts yet'}
        onClick={openSidebar}
        disabled={!hasPrompts}
        className="md:hidden px-3 py-1.5 rounded text-sm flex items-center bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-800"
      >
        <History className="w-4 h-4" aria-hidden="true" />
      </button>
    );
  }, [hasPrompts, openSidebar]);

  return (
    <div className="h-screen flex bg-slate-900 text-white">
      <SidebarWithSheet
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        sidebarProps={{ promptNodesRef: nodes, handleLoadPrompt }}
      />

      <main className="flex-1 flex flex-col">
        <PromptEditor
          prompt={{
            title,
            instructions,
            icon: winner !== null && winner === 'llama' ? '🦙' : '🐍',
            winner,
            modelResponses,
          }}
          isLoading={isLoading}
          handleTestPrompt={handleTestPrompt}
          handleClear={handleClear}
          applyModifier={applyModifier}
          modifierTextByType={MODIFIERS}
          openSidebarButton={openSidebarButton}
          canSave={canSavePrompt}
          canDelete={canDeletePrompt}
          handleSave={handleSave}
          handleDelete={handleDeletePrompt}
          setTitle={setTitle}
          setInstructions={setInstructions}
        />

        {/* Model Responses - Side by Side */}
        <section className="flex-1 grid grid-cols-2 min-h-0">
          {modelResponses.map((r, idx) => {
            const modelId = r.model_id;
            const canPickWinner = modelId === 'llama' || modelId === 'qwen';
            const key = `${modelId}-${r.created_at ?? idx}`;
            return (
              <ModelResponse
                key={key}
                modelName={modelId}
                response={r.response}
                winnerButton={
                  canPickWinner ? (
                    <WinnerButton
                      model={modelId}
                      onClick={() => handleWinner(modelId)}
                      isWinner={winner === modelId}
                    />
                  ) : null
                }
              />
            );
          })}
        </section>
      </main>
    </div>
  );
}
