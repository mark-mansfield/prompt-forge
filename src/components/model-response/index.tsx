export const ModelResponse = ({
  response,
  modelName,
  winnerButton,
}: {
  response: string;
  modelName: string;
  winnerButton: React.ReactNode;
}) => {
  return (
    <div className="border-r border-slate-700 flex flex-col">
      <div className="p-3 border-b border-slate-700 flex items-center gap-2">
        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
        <h3 className="text-sm font-medium">{modelName}</h3>
      </div>
      <div className="flex-1 p-4 overflow-y-auto text-sm text-slate-300 whitespace-pre-wrap">
        {response || <span className="text-slate-500">Response will appear here...</span>}
      </div>
      {winnerButton}
    </div>
  );
};
