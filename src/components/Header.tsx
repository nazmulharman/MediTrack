import React from 'react';
import { User } from 'firebase/auth';
import { PatientProfile } from '../types/medicine';
import { SmartLogo } from './SmartLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentTab: string;
  activeProfile: PatientProfile;
  onOpenProfiles: () => void;
  onOpenSmartLogo?: () => void;
  onOpenGoogleDrive?: () => void;
  googleUser?: User | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  activeProfile,
  onOpenProfiles,
  onOpenSmartLogo,
  onOpenGoogleDrive,
  googleUser,
}) => {
  const getTabLabel = () => {
    switch (currentTab) {
      case 'today':
        return 'Today';
      case 'medicines':
        return 'Medicines';
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
            </div>
            <div className="flex items-center gap-1 text-[12px] leading-tight">
              <span className="text-on-surface-variant font-medium">{todayDateString}</span>
              <span className="text-outline-variant">•</span>
              <span className="text-primary font-semibold">{getTabLabel()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* In-App PWA Install Button */}
          <PWAInstallButton />

          {/* Google Drive Cloud Sync Button */}
          {onOpenGoogleDrive && (
            <button
              aria-label={googleUser ? `Google Drive Connected (${googleUser.email})` : 'Connect Google Drive'}
              title={googleUser ? `Google Drive Connected (${googleUser.email})` : 'Log in with Google & Sync Drive'}
              type="button"
              onClick={onOpenGoogleDrive}
              className={`relative h-9 px-2.5 rounded-full flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-95 border ${
                googleUser
                  ? 'bg-secondary-fixed/30 hover:bg-secondary-fixed/50 text-on-secondary-fixed-variant border-secondary/30 shadow-2xs'
                  : 'bg-surface-container-low hover:bg-surface-container text-on-surface border-surface-container'
              }`}
            >
              {/* Google Drive Tri-color Icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>

              <span className="hidden xs:inline text-[11px] font-bold">
                {googleUser ? 'Drive Synced' : 'Drive'}
              </span>

              {googleUser ? (
                <span className="w-2 h-2 rounded-full bg-secondary shrink-0 shadow-2xs" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-outline-variant shrink-0" />
              )}
            </button>
          )}

          {/* Profile Switcher Button */}
          <button
            aria-label="Account and Profile"
            className="relative w-9 h-9 rounded-full flex items-center justify-center p-0.5 shrink-0 bg-surface-container-low hover:bg-surface-container transition-transform active:scale-95 border border-primary/20"
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
      </div>
    </header>
  );
};

