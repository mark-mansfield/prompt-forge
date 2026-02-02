import { useCallback, useMemo, useRef, useState } from 'react';
import { History } from 'lucide-react';
import { ModelResponse } from '../model-response';
import { WinnerButton } from '../winner-button';
import { PromptEditor } from '../prompt-editor';
import type { Prompt } from './types';
import { parseJsonEventStream, readUIMessageStream, uiMessageChunkSchema } from 'ai';
import { graphql, useLazyLoadQuery, useMutation } from 'react-relay';
import { useSavedPromptsConnectionUpdaters } from '../../relay/hooks/useSavedPromptsConnectionUpdaters';
import type { sidebar_prompts_fragment$key } from '../sidebar/__generated__/sidebar_prompts_fragment.graphql';
import type { layoutQuery as LayoutQueryType } from './__generated__/layoutQuery.graphql';
import type { layoutSavePromptMutation } from './__generated__/layoutSavePromptMutation.graphql';
import type { layoutUpdatePromptMutation } from './__generated__/layoutUpdatePromptMutation.graphql';
import type { layoutDeletePromptMutation } from './__generated__/layoutDeletePromptMutation.graphql';
import { toast } from 'sonner';
import { SidebarWithSheet } from '../sidebar/SidebarWithSheet';
import type { ModifierType } from '../../utils/modifier-tools';
import { detectActiveModifiers, toggleModifierInText, MODIFIERS } from '../../utils/modifier-tools';

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
    winner: 'llama' | 'gemini' | null;
  } | null>(null);

  const data = useLazyLoadQuery<LayoutQueryType>(LayoutQuery, {});
  const nodes: sidebar_prompts_fragment$key =
    data.saved_promptsCollection?.edges?.map((e) => e.node) ?? [];

  const [winner, setWinner] = useState<'llama' | 'gemini' | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const streamControllersRef = useRef<{
    groq: AbortController | null;
    google: AbortController | null;
  }>({ groq: null, google: null });

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

  const hasAnyModelResponses = modelResponses.some((r) => Boolean(r.response?.trim()));
  const canSavePrompt =
    isValid && isDirty && winner !== null && !isMutating && hasAnyModelResponses;
  const canDeletePrompt = Boolean(editingId) && !isMutating;

  const activeModifiers = useMemo(
    () => Array.from(detectActiveModifiers(instructions)),
    [instructions]
  );

  function applyModifier(type: ModifierType): 'added' | 'removed' {
    let action: 'added' | 'removed' = 'added';
    setInstructions((prev) => {
      const result = toggleModifierInText(prev, type);
      action = result.action;
      return result.nextText;
    });
    return action;
  }

  function handleWinner(winnerEnum: 'llama' | 'gemini') {
    setWinner(winnerEnum);
  }

  const isLoading = modelResponses.some((r) => r.status === 'streaming');

  const providerToModelId = useMemo(() => {
    // UI-facing model ids (what we render in the panels).
    return {
      groq: 'llama-3.1-8b-instant',
      google: 'gemini-2.5-flash',
    } as const;
  }, []);

  // UI-only: Google model dropdown (not persisted when loading saved prompts).
  const [googleSelectedModelId, setGoogleSelectedModelId] = useState<string>(
    providerToModelId.google
  );

  const googleModelOptions = useMemo(
    () =>
      [
        { id: providerToModelId.google, label: 'Flash' },
        { id: 'gemini-2.5-flash-lite', label: 'Flash-Lite' },
      ] as const,
    [providerToModelId.google]
  );

  const normalizeModelId = useCallback((modelId: string) => {
    // Back-compat: older saved data used short ids ('llama'/'qwen' or 'gemini').
    // TODO(mark): Remove this back-compat once the database stores only
    // `llama-3.1-8b-instant` and `gemini-2.5-flash` in all model response rows.
    if (modelId === 'llama') return 'llama-3.1-8b-instant';
    if (modelId === 'qwen') return 'gemini-2.5-flash';
    if (modelId === 'gemini') return 'gemini-2.5-flash';
    return modelId;
  }, []);

  const handleStop = useCallback(() => {
    // Abort any in-flight streams.
    streamControllersRef.current.groq?.abort();
    streamControllersRef.current.google?.abort();
  }, []);

  const runOneProvider = useCallback(
    async (provider: 'groq' | 'google', prompt: string) => {
      const modelId = provider === 'google' ? googleSelectedModelId : providerToModelId.groq;
      const controller = new AbortController();
      streamControllersRef.current[provider] = controller;

      // Typewriter reveal: buffer incoming text and reveal at a fixed rate.
      const TYPEWRITER_CHARS_PER_SEC = 50;
      let receivedText = '';
      let displayedText = '';
      let pendingText = '';
      let upstreamDone = false;
      let budget = 0;

      let drainPromise: Promise<void> | null = null;
      const nextFrame = () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const startDrainLoop = () => {
        if (drainPromise) return;
        drainPromise = (async () => {
          let last = performance.now();
          while (true) {
            if (controller.signal.aborted) return;

            const now = performance.now();
            const dtMs = now - last;
            last = now;
            budget += (TYPEWRITER_CHARS_PER_SEC * dtMs) / 1000;

            const take = Math.min(pendingText.length, Math.floor(budget));
            if (take > 0) {
              const next = pendingText.slice(0, take);
              pendingText = pendingText.slice(take);
              budget -= take;
              displayedText += next;
              setModelResponses((prev) =>
                prev.map((r) => (r.model_id === modelId ? { ...r, response: displayedText } : r))
              );
            }

            if (pendingText.length === 0 && upstreamDone) return;
            await nextFrame();
          }
        })();
      };

      setModelResponses((prev) =>
        prev.map((r) =>
          r.model_id === modelId
            ? { ...r, status: 'streaming', error: undefined, usage: undefined, response: '' }
            : r
        )
      );

      let res: Response;
      try {
        res = await fetch('/.netlify/functions/llm-stream', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(
            provider === 'google'
              ? { provider, prompt, modelId: googleSelectedModelId }
              : { provider, prompt }
          ),
          signal: controller.signal,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setModelResponses((prev) =>
            prev.map((r) =>
              r.model_id === modelId ? { ...r, status: 'aborted', error: undefined } : r
            )
          );
          return { finishedOk: false, aborted: true };
        }
        throw err;
      }

      if (!res.body) throw new Error(`${provider} response body was empty`);

      const parsed = parseJsonEventStream({ stream: res.body, schema: uiMessageChunkSchema });
      const chunks = parsed.pipeThrough(
        new TransformStream({
          transform(result, controller) {
            if (!result.success) return;
            // Explicitly surface protocol error chunks into the UI.
            // Some providers can return HTTP 200 while streaming an `error` chunk.
            if (result.value.type === 'error') {
              const msg = result.value.errorText || 'LLM request failed';
              setModelResponses((prev) =>
                prev.map((r) =>
                  r.model_id === modelId ? { ...r, status: 'error', error: msg } : r
                )
              );
              controller.error(new Error(msg));
              return;
            }

            controller.enqueue(result.value);
          },
        })
      );

      let latestText = '';
      try {
        for await (const uiMessage of readUIMessageStream({
          stream: chunks,
          terminateOnError: true,
          onError: (err) => {
            const msg = err instanceof Error ? err.message : String(err);
            throw new Error(`${provider} stream error: ${msg}`);
          },
        })) {
          const nextText = uiMessage.parts
            .filter((p) => p.type === 'text')
            .map((p) => p.text)
            .join('');

          if (nextText !== latestText) {
            if (nextText.startsWith(latestText)) {
              pendingText += nextText.slice(latestText.length);
            } else if (nextText.startsWith(receivedText)) {
              pendingText += nextText.slice(receivedText.length);
            } else {
              pendingText = nextText;
              displayedText = '';
            }
            latestText = nextText;
            receivedText = nextText;
            startDrainLoop();
          }

          const md = uiMessage.metadata as
            | { totalTokens?: unknown; inputTokens?: unknown; outputTokens?: unknown }
            | undefined;
          const totalTokens = typeof md?.totalTokens === 'number' ? md.totalTokens : undefined;
          const inputTokens = typeof md?.inputTokens === 'number' ? md.inputTokens : undefined;
          const outputTokens = typeof md?.outputTokens === 'number' ? md.outputTokens : undefined;

          if (totalTokens != null || inputTokens != null || outputTokens != null) {
            setModelResponses((prev) =>
              prev.map((r) =>
                r.model_id === modelId
                  ? { ...r, usage: { totalTokens, inputTokens, outputTokens } }
                  : r
              )
            );
          }
        }

        upstreamDone = true;
        startDrainLoop();
        await drainPromise;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setModelResponses((prev) =>
            prev.map((r) =>
              r.model_id === modelId ? { ...r, status: 'aborted', error: undefined } : r
            )
          );
          upstreamDone = true;
          return { finishedOk: false, aborted: true };
        }
        throw err;
      } finally {
        if (streamControllersRef.current[provider] === controller) {
          streamControllersRef.current[provider] = null;
        }
      }

      const finishedOk = res.ok;
      setModelResponses((prev) =>
        prev.map((r) =>
          r.model_id === modelId && r.status !== 'aborted' ? { ...r, status: 'done' } : r
        )
      );
      return { finishedOk, aborted: false };
    },
    [googleSelectedModelId, providerToModelId.groq]
  );

  const handleExecutePrompt = async () => {
    if (isLoading) return;
    if (!instructions.trim()) return;

    try {
      // If user re-runs quickly, cancel any in-flight streams first.
      handleStop();

      const prompt = instructions.trim();

      const providers = ['groq', 'google'] as const;
      const startedAtIso = new Date().toISOString();

      // Initialize two empty panels immediately (typewriter target).
      setModelResponses(
        providers.map((provider) => ({
          model_id: provider === 'google' ? googleSelectedModelId : providerToModelId[provider],
          response: '',
          created_at: startedAtIso,
          status: 'streaming',
          error: undefined,
          usage: undefined,
        }))
      );

      const results = await Promise.allSettled(
        providers.map(async (p) => ({ provider: p, ...(await runOneProvider(p, prompt)) }))
      );

      const anySucceeded = results.some((r) => r.status === 'fulfilled' && r.value.finishedOk);
      const anyHardFailure = results.some(
        (r) =>
          r.status === 'rejected' ||
          (r.status === 'fulfilled' && !r.value.finishedOk && !r.value.aborted)
      );

      results.forEach((r) => {
        if (r.status === 'rejected') {
          console.error('LLM stream failed:', r.reason);
        }
      });

      // Mark per-panel errors (so the UI shows them inline).
      results.forEach((r, idx) => {
        if (r.status !== 'rejected') return;
        const provider = providers[idx];
        const modelId = providerToModelId[provider];
        const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
        setModelResponses((prev) =>
          prev.map((mr) => (mr.model_id === modelId ? { ...mr, status: 'error', error: msg } : mr))
        );
      });

      // Only toast on *actual* failures. Successful runs should be silent,
      // and user-cancelled runs should not show error toasts.
      if (anyHardFailure) {
        if (anySucceeded) toast.error('One model failed (see console)');
        else toast.error('LLM test failed (see console)');
      }
    } catch (err) {
      console.error('LLM test failed:', err);
      toast.error('LLM test failed (see console)');
    } finally {
      // isLoading is derived from modelResponses
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

    const icon = winner === 'llama' ? '🦙' : '♊';

    if (editingId) {
      // Editing an existing prompt: keep whatever model responses are already present,
      // without requiring a fresh run (saved prompts may not have UI-only `status`).
      const out = modelResponses
        .map((r) => ({ model_id: normalizeModelId(r.model_id), response: r.response }))
        .filter((r) => r.response.trim());

      if (out.length === 0) {
        toast.error('Run a model at least once before saving');
        return;
      }

      const modelResponsesForSave = JSON.stringify(out);
      commitUpdatePrompt({
        variables: {
          filter: { id: { eq: editingId } },
          set: {
            title,
            instructions,
            icon,
            winner,
            model_responses: modelResponsesForSave,
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

    // Creating a new prompt: require both model responses and a completed run.
    // Supabase GraphQL `JSON` inputs can be finicky; in practice, sending a JSON string
    // is the most compatible format. We intentionally omit created_at/updated_at.
    const modelResponsesForSave = (() => {
      const requiredModelIds = ['llama-3.1-8b-instant', googleSelectedModelId] as const;

      const byModelId = new Map(
        modelResponses.map((r) => [normalizeModelId(r.model_id), r] as const)
      );

      const out: Array<{ model_id: string; response: string }> = [];

      for (const uiModelId of requiredModelIds) {
        const r = byModelId.get(uiModelId);
        if (!r || r.status !== 'done' || !r.response.trim()) return null;

        // Store the full model id in the JSON column (not the winner enum).
        out.push({ model_id: uiModelId, response: r.response });
      }

      return JSON.stringify(out);
    })();

    if (!modelResponsesForSave) {
      toast.error('Run both models and wait for completion before saving');
      return;
    }

    commitSavePrompt({
      variables: {
        object: {
          title,
          instructions,
          icon,
          winner,
          model_responses: modelResponsesForSave,
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
    const normalized = prompt.modelResponses.map((r) => ({
      ...r,
      model_id: normalizeModelId(r.model_id),
    }));
    setModelResponses(normalized);

    // Align the Google dropdown to the loaded prompt's Google model id (if present).
    const googleModelId = normalized.find((r) => r.model_id.startsWith('gemini-'))?.model_id;
    if (
      googleModelId &&
      googleModelOptions.some((opt) => opt.id === googleModelId) &&
      googleModelId !== googleSelectedModelId
    ) {
      setGoogleSelectedModelId(googleModelId);
    }
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
    <div className="min-h-screen flex bg-slate-900 text-white">
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
            icon: winner !== null && winner === 'llama' ? '🦙' : '♊',
            winner,
            modelResponses,
          }}
          isLoading={isLoading}
          handleExecutePrompt={handleExecutePrompt}
          handleStop={handleStop}
          handleClear={handleClear}
          applyModifier={applyModifier}
          modifierTextByType={MODIFIERS}
          activeModifiers={activeModifiers}
          openSidebarButton={openSidebarButton}
          canSave={canSavePrompt}
          canDelete={canDeletePrompt}
          handleSave={handleSave}
          handleDelete={handleDeletePrompt}
          setTitle={setTitle}
          setInstructions={setInstructions}
        />

        {/* Model Responses - Side by Side */}
        <section className="grid grid-cols-2 items-stretch min-h-screen">
          {modelResponses.map((r, idx) => {
            const modelId = normalizeModelId(r.model_id);
            const key = `${modelId}-${r.created_at ?? idx}`;
            const provider: 'groq' | 'google' =
              modelId === 'llama-3.1-8b-instant' ? 'groq' : 'google';
            const canPickWinner = true;
            const winnerEnum: 'llama' | 'gemini' = provider === 'groq' ? 'llama' : 'gemini';

            const googleDropdown =
              provider === 'google' ? (
                <select
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                  value={googleSelectedModelId}
                  onChange={(e) => {
                    const next = e.target.value;
                    setGoogleSelectedModelId(next);
                    // Clear the existing Google pane response so it's obvious it needs re-run.
                    setModelResponses((prev) =>
                      prev.map((mr) => {
                        const mrProvider =
                          normalizeModelId(mr.model_id) === 'llama-3.1-8b-instant'
                            ? 'groq'
                            : 'google';
                        if (mrProvider !== 'google') return mr;
                        return {
                          ...mr,
                          model_id: next,
                          status: 'idle',
                          error: undefined,
                          usage: undefined,
                          response: '',
                        };
                      })
                    );
                  }}
                  disabled={r.status === 'streaming'}
                  title={googleSelectedModelId}
                >
                  {googleModelOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : null;
            return (
              <ModelResponse
                key={key}
                modelName={modelId}
                headerInline={googleDropdown}
                response={r.response}
                status={r.status}
                error={r.error}
                usage={r.usage}
                onRetry={
                  r.status === 'error' || (provider === 'google' && r.status === 'idle')
                    ? async () => {
                        if (!instructions.trim()) return;
                        try {
                          await runOneProvider(provider, instructions.trim());
                        } catch (err) {
                          const msg = err instanceof Error ? err.message : String(err);
                          setModelResponses((prev) =>
                            prev.map((mr) =>
                              mr.model_id === modelId ? { ...mr, status: 'error', error: msg } : mr
                            )
                          );
                        } finally {
                          // isLoading is derived from modelResponses
                        }
                      }
                    : undefined
                }
                onAbort={
                  r.status === 'streaming'
                    ? () => {
                        streamControllersRef.current[provider]?.abort();
                        setModelResponses((prev) =>
                          prev.map((mr) =>
                            mr.model_id === modelId
                              ? { ...mr, status: 'aborted', error: undefined }
                              : mr
                          )
                        );
                      }
                    : undefined
                }
                winnerButton={
                  canPickWinner && winnerEnum ? (
                    <WinnerButton
                      label={modelId}
                      onClick={() => handleWinner(winnerEnum)}
                      isWinner={winner === winnerEnum}
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
