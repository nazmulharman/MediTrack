import React from 'react';

export type TabType = 'today' | 'medicines' | 'vault' | 'history' | 'settings';

interface BottomNavProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  hasRefillAlert?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onChangeTab,
  hasRefillAlert = true,
}) => {
  const tabs = [
    {
      id: 'today' as TabType,
      label: 'Today',
      icon: 'event_available',
    },
    {
      id: 'medicines' as TabType,
      label: 'Medicines',
      icon: 'medication',
      badge: hasRefillAlert,
    },
    {
      id: 'vault' as TabType,
      label: 'Vault',
      icon: 'folder_supervised',
    },
    {
      id: 'history' as TabType,
      label: 'History',
      icon: 'query_stats',
    },
    {
      id: 'settings' as TabType,
      label: 'Settings',
      icon: 'settings',
    },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-none px-4 pb-safe">
      <nav
        className="pointer-events-auto max-w-md mx-auto h-16 rounded-full bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,104,95,0.12)] border border-primary/10 flex items-center justify-around px-1"
        aria-label="App Navigation"
      >
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center flex-1 h-12 rounded-full transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-primary font-semibold bg-surface-container-low shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {tab.icon}
              </span>
              <span className="text-[11px] font-medium tracking-tight mt-0.5 leading-none">
                {tab.label}
              </span>

              {tab.badge && !isActive && (
                <span className="absolute top-1.5 right-3.5 h-2 w-2 rounded-full bg-error ring-2 ring-surface-container-lowest" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
