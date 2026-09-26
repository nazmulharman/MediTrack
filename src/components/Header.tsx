import React from 'react';
import { PatientProfile } from '../types/medicine';
import { SmartLogo } from './SmartLogo';

interface HeaderProps {
  currentTab: string;
  activeProfile: PatientProfile;
  onOpenProfiles: () => void;
  onOpenSmartLogo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  activeProfile,
  onOpenProfiles,
  onOpenSmartLogo,
}) => {
  const getTabLabel = () => {
    switch (currentTab) {
      case 'today':
        return 'Today';
      case 'medicines':
        return 'Medicines';
      case 'vault':
        return 'Vault';
      case 'history':
        return 'History';
      case 'settings':
        return 'Settings';
      default:
        return 'Today';
    }
  };

  const todayDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.03)] border-b border-surface-container-low/60">
      <div className="h-16 px-4 max-w-lg mx-auto flex items-center justify-between gap-3">
        <div
          onClick={onOpenSmartLogo}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer group active:scale-98 transition-transform"
          title="Open Smart Logo & Brand Details"
        >
          <SmartLogo size="sm" showBeacon={true} pulseAnimated={true} />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-headline font-extrabold text-[17px] text-on-surface tracking-tight truncate group-hover:text-primary transition-colors">
                MediTrack
              </span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed-variant text-[10px] font-bold shrink-0">
                <span className="material-symbols-outlined text-[11px]">lock</span>
                Smart Vault
              </span>
            </div>
            <div className="flex items-center gap-1 text-[12px] leading-tight">
              <span className="text-on-surface-variant font-medium">{todayDateString}</span>
              <span className="text-outline-variant">•</span>
              <span className="text-primary font-semibold">{getTabLabel()}</span>
            </div>
          </div>
        </div>

        <button
          aria-label="Account and Profile"
          className="relative w-10 h-10 rounded-full flex items-center justify-center p-0.5 shrink-0 bg-surface-container-low hover:bg-surface-container transition-transform active:scale-95 border border-primary/20"
          type="button"
          onClick={onOpenProfiles}
        >
          {activeProfile.avatarUrl ? (
            <img
              alt={activeProfile.name}
              className="w-8 h-8 rounded-full object-cover"
              src={activeProfile.avatarUrl}
            />
          ) : (
            <span className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-xs flex items-center justify-center">
              {activeProfile.initials}
            </span>
          )}
          {activeProfile.hasAlerts && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-error ring-2 ring-surface" />
          )}
        </button>
      </div>
    </header>
  );
};
