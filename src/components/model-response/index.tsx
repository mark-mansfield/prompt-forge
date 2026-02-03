export const ModelResponse = ({
  response,
  modelName,
  headerInline,
  status,
  error,
  usage,
  onRetry,
  onAbort,
  winnerButton,
}: {
  response: string;
  modelName: string;
  headerInline?: React.ReactNode;
  status?: 'idle' | 'streaming' | 'done' | 'error' | 'aborted';
  error?: string;
  usage?: {
    totalTokens?: number;
    inputTokens?: number;
    outputTokens?: number;
  };
  onRetry?: () => void;
  onAbort?: () => void;
  winnerButton: React.ReactNode;
}) => {
  const dot =
    status === 'error'
      ? 'bg-red-400'
      : status === 'aborted'
        ? 'bg-slate-400'
        : status === 'streaming'
          ? 'bg-amber-300'
          : status === 'done'
            ? 'bg-green-400'
            : 'bg-slate-500';

  const statusLabel =
    status === 'error'
      ? 'Error'
      : status === 'aborted'
        ? 'Cancelled'
        : status === 'streaming'
          ? 'Streaming'
          : status === 'done'
            ? 'Done'
            : 'Idle';

  const tokenLine =
    usage?.totalTokens != null || usage?.inputTokens != null || usage?.outputTokens != null
      ? `Tokens: ${usage?.totalTokens ?? '—'} (in ${usage?.inputTokens ?? '—'} / out ${usage?.outputTokens ?? '—'})`
      : null;

  return (
    <div className="border-r border-slate-700 flex flex-col h-full">
      <div className="p-3 border-b border-slate-700">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 h-10">
            <span className={`w-2 h-2 ${dot} rounded-full`} aria-hidden="true" />
            <h3 className="text-sm font-medium truncate">{modelName}</h3>
            {headerInline ? <div className="shrink-0">{headerInline}</div> : null}
            {tokenLine ? (
              <span className="text-xs text-slate-500 whitespace-nowrap">{tokenLine}</span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {status === 'streaming' && onAbort ? (
              <button
                type="button"
                onClick={onAbort}
                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white"
                title="Stop this stream"
              >
                Stop
              </button>
            ) : null}
            {(status === 'error' || status === 'idle' || status === 'aborted') && onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white"
                title="Retry this model"
              >
                Retry
              </button>
            ) : null}
            <span className="text-xs text-slate-400">{statusLabel}</span>
          </div>
        </div>
      </div>
      <div className="flex-1 p-4 text-sm text-slate-300 whitespace-pre-wrap">
        {error ? (
          <div className="mb-3">
            <div className="text-sm text-red-300 whitespace-pre-wrap">{error}</div>
          </div>
        ) : null}

        {response ? (
          response
        ) : status === 'error' ? null : (
          <span className="text-slate-500">Response will appear here...</span>
        )}
      </div>
      {winnerButton}
    </div>
  );
};
