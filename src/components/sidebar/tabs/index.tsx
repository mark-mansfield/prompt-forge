import { useState } from 'react';

export const Tabs = (): React.ReactNode => {
  const tabs = [
    { id: 'all', name: 'All' },
    { id: 'llama', name: 'Llama' },
    { id: 'qwen', name: 'Qwen' },
  ];

  const [activeTab, setActiveTab] = useState('all');
  return (
    <div className="border-b border-slate-700 pt-12 flex gap-2 ml-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`text-sm font-medium text-slate-400 hover:text-white ${activeTab === tab.id ? 'text-white border-b-2 border-blue-500' : 'border-b-2 border-transparent'}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.name}
        </button>
      ))}
    </div>
  );
};
