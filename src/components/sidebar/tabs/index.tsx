import { useRelayEnvironment } from 'react-relay';
import { setActiveTabId } from '../../../relay/ui-state';
type Tab = {
  id: string;
  name: string;
};

const TABS: Tab[] = [
  { id: 'all', name: 'All' },
  { id: 'llama', name: 'Llama' },
  { id: 'qwen', name: 'Qwen' },
];

export const Tabs = ({ activeTabId }: { activeTabId: string }): React.ReactNode => {
  const environment = useRelayEnvironment();

  return (
    <div className="border-b border-slate-700 pt-8 flex gap-2 ml-4">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`text-sm font-medium text-slate-400 hover:text-white ${activeTabId === tab.id ? 'text-white border-b-2 border-blue-500' : 'border-b-2 border-transparent'}`}
          onClick={() => setActiveTabId(environment, tab.id)}
        >
          {tab.name}
        </button>
      ))}
    </div>
  );
};
