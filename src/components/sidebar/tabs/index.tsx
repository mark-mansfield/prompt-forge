import { useRelayEnvironment } from 'react-relay';
import { setActiveTabId } from '../../../relay/ui-state';
import { Button } from '../../ui/button';
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
        <Button
          key={tab.id}
          variant="ghost"
          size="sm"
          title={tab.fullName ?? tab.shortName}
          className={`h-auto rounded-none border-b-2 px-0 pb-2 pt-0 text-slate-400 hover:bg-transparent hover:text-white ${activeTabId === tab.id ? 'border-blue-500 text-white' : 'border-transparent'}`}
          onClick={() => setActiveTabId(environment, tab.id)}
        >
          {tab.shortName}
        </Button>
      ))}
    </div>
  );
};
