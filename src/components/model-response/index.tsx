import { Button } from '../ui/button';

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

  const tokenLine =
    usage?.totalTokens != null || usage?.inputTokens != null || usage?.outputTokens != null
      ? `Tokens: ${usage?.totalTokens ?? '—'} (in ${usage?.inputTokens ?? '—'} / out ${usage?.outputTokens ?? '—'})`
      : null;

  return (
    <div className="border-r border-slate-700 flex flex-col h-full">
      <div className="border-b border-slate-700 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${dot} ${status === 'streaming' ? 'animate-ping' : ''}`}
                aria-hidden="true"
              />
              <h3
                className={`min-w-40 shrink-0 truncate rounded px-1 py-0.5 text-sm font-medium ${status === 'streaming' ? 'text-gradient text-transparent animate-gradient-text' : 'text-white'}`}
                title={modelName}
              >
                {modelName}
              </h3>
              {headerInline ? <div className="shrink-0">{headerInline}</div> : null}
            </div>
            {tokenLine ? <div className="pl-4 text-xs text-slate-500">{tokenLine}</div> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {status === 'streaming' && onAbort ? (
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={onAbort}
                className="bg-slate-700 hover:bg-slate-600"
                title="Stop this stream"
              >
                Stop
              </Button>
            ) : null}
            {(status === 'error' || status === 'idle' || status === 'aborted') && onRetry ? (
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={onRetry}
                className="bg-slate-700 hover:bg-slate-600"
                title="Retry this model"
              >
                Retry
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex-1 p-4 text-sm text-slate-300 whitespace-pre-wrap">
        {error ? (
          <div className="mb-3 space-y-1">
            <div className="text-sm text-red-300">Something went wrong.</div>
            <div className="text-xs text-slate-400">
              Try switching models or running the prompt again.
            </div>
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
