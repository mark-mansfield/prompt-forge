import { useRelayEnvironment } from 'react-relay';
import { setActiveTabId } from '../../../utils/ui-state';
type Tab = {
  id: string;
  shortName: string;
  fullName?: string;
};

const TABS: Tab[] = [
  { id: 'all', shortName: 'All' },
  { id: 'llama-3.1-8b-instant', shortName: 'Llama', fullName: 'llama-3.1-8b-instant' },
  { id: 'gemini-2.5-flash', shortName: 'Gemini', fullName: 'gemini-2.5-flash' },
];

export const Tabs = ({ activeTabId }: { activeTabId: string }): React.ReactNode => {
  const environment = useRelayEnvironment();

  return (
    <div className="border-b border-slate-700 pt-8 flex gap-2 px-4">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          title={tab.fullName ?? tab.shortName}
          className={`text-sm font-medium text-slate-400 hover:text-white ${activeTabId === tab.id ? 'text-white border-b-2 border-blue-500' : 'border-b-2 border-transparent'}`}
          onClick={() => setActiveTabId(environment, tab.id)}
        >
          {tab.shortName}
        </button>
      ))}
    </div>
  );
};
