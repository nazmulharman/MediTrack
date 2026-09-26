import React, { useState } from 'react';
import { PatientProfile, NotificationSettings } from '../types/medicine';
import { notificationService } from '../services/notificationService';
import { SmartLogo } from './SmartLogo';
import { SmartLogoModal } from './SmartLogoModal';

interface SettingsTabProps {
  profiles: PatientProfile[];
  activeProfile: PatientProfile;
  onSelectProfile: (profile: PatientProfile) => void;
  onAddProfile: (profile: PatientProfile) => void;
  settings: NotificationSettings;
  onUpdateSettings: (settings: NotificationSettings) => void;
  onResetData: () => void;
  onExportData: () => void;
  onTestNotification?: () => void;
  onOpenSmartLogo?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  profiles,
  activeProfile,
  onSelectProfile,
  onAddProfile,
  settings,
  onUpdateSettings,
  onResetData,
  onExportData,
  onTestNotification,
  onOpenSmartLogo,
}) => {
  const [appLockEnabled, setAppLockEnabled] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState<'child' | 'parent' | 'spouse' | 'other'>('child');
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() =>
    notificationService.getPermissionStatus()
  );

  const handleRequestPermission = async () => {
    const res = await notificationService.requestPermission();
    setBrowserPermission(res);
    if (res === 'granted') {
      notificationService.playGentleChime();
    }
  };

  const handleCreateProfile = () => {
    if (!newName.trim()) return;
    const newP: PatientProfile = {
      id: `p-${Date.now()}`,
      name: `${newName.trim()} (${newRelation.charAt(0).toUpperCase() + newRelation.slice(1)})`,
      shortName: newName.trim(),
      relation: newRelation,
      relationLabel: newRelation.charAt(0).toUpperCase() + newRelation.slice(1),
      initials: newName.trim().slice(0, 2).toUpperCase(),
      badgeColor: 'bg-primary text-on-primary',
    };
    onAddProfile(newP);
    setNewName('');
    setShowAddMember(false);
  };

  return (
    <div className="flex flex-col w-full space-y-4 pb-28 pt-2">
      {/* Title */}
      <div className="rounded-3xl bg-surface-container-high/60 p-4 border border-primary/10 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">settings</span>
          </div>
          <div>
            <h2 className="font-headline font-bold text-xl text-on-surface">Settings & Care</h2>
            <p className="text-xs text-on-surface-variant font-medium">
              Family profiles, alarms & data security
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[11px] font-bold">
          v2.4 Encrypted
        </span>
      </div>

      {/* Family Multi-Profile Management */}
      <section className="rounded-3xl bg-surface-container-lowest p-4 border border-surface-container shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">group</span>
            <h3 className="font-headline font-bold text-sm text-on-surface">Family Profiles</h3>
          </div>
          <button
            onClick={() => setShowAddMember(true)}
            className="text-xs text-primary font-bold flex items-center gap-0.5 hover:underline"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Member
          </button>
        </div>

        <div className="space-y-2">
          {profiles.map((p) => {
            const isSelected = p.id === activeProfile.id;
            return (
              <div
                key={p.id}
                onClick={() => onSelectProfile(p)}
                className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-secondary-fixed/30 border-primary/30'
                    : 'bg-surface-container-low border-transparent hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-3">
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={p.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <span className="w-9 h-9 rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-xs flex items-center justify-center">
                      {p.initials}
                    </span>
                  )}
                  <div>
                    <h4 className="font-headline font-bold text-xs text-on-surface">{p.name}</h4>
                    <p className="text-[11px] text-on-surface-variant">
                      {p.relationLabel || 'Dependent'} {p.age ? `• ${p.age} yrs` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isSelected ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs text-outline font-semibold">Switch</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Member Drawer */}
        {showAddMember && (
          <div className="p-3.5 rounded-2xl bg-surface-container-high/50 border border-primary/20 space-y-3 animate-in fade-in duration-150">
            <h4 className="text-xs font-bold text-on-surface">New Dependent or Family Member</h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name (e.g. Grandma Rose)"
                className="flex-1 px-3 py-2 rounded-xl bg-surface-container-lowest text-xs font-semibold text-on-surface focus:outline-none"
              />
              <select
                value={newRelation}
                onChange={(e) => setNewRelation(e.target.value as any)}
                aria-label="Family relation"
                className="px-2.5 py-2 rounded-xl bg-surface-container-lowest text-xs font-semibold text-on-surface focus:outline-none"
              >
                <option value="child">Child</option>
                <option value="parent">Parent</option>
                <option value="spouse">Spouse</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddMember(false)}
                className="px-3 py-1 rounded-full text-xs font-semibold text-on-surface-variant"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateProfile}
                className="px-4 py-1 rounded-full bg-primary text-on-primary text-xs font-bold shadow-sm"
              >
                Save Member
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Notification Schedule Preferences */}
      <section className="rounded-3xl bg-surface-container-lowest p-4 border border-surface-container shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">
              notifications_active
            </span>
            <h3 className="font-headline font-bold text-sm text-on-surface">Reminder Windows</h3>
          </div>
          <span className="text-[11px] text-outline font-semibold">Actionable Alerts</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-surface-container-low flex flex-col justify-between">
            <span className="text-[11px] font-bold text-on-surface-variant">Morning Routine</span>
            <input
              type="time"
              value={settings.morningTime}
              onChange={(e) => onUpdateSettings({ ...settings, morningTime: e.target.value })}
              className="mt-1 font-headline font-bold text-sm text-primary bg-transparent focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-2xl bg-surface-container-low flex flex-col justify-between">
            <span className="text-[11px] font-bold text-on-surface-variant">Afternoon Dose</span>
            <input
              type="time"
              value={settings.afternoonTime}
              onChange={(e) => onUpdateSettings({ ...settings, afternoonTime: e.target.value })}
              className="mt-1 font-headline font-bold text-sm text-primary bg-transparent focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-2xl bg-surface-container-low flex flex-col justify-between">
            <span className="text-[11px] font-bold text-on-surface-variant">Evening Dinner</span>
            <input
              type="time"
              value={settings.eveningTime}
              onChange={(e) => onUpdateSettings({ ...settings, eveningTime: e.target.value })}
              className="mt-1 font-headline font-bold text-sm text-primary bg-transparent focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-2xl bg-surface-container-low flex flex-col justify-between">
            <span className="text-[11px] font-bold text-on-surface-variant">Night & Bedtime</span>
            <input
              type="time"
              value={settings.nightTime}
              onChange={(e) => onUpdateSettings({ ...settings, nightTime: e.target.value })}
              className="mt-1 font-headline font-bold text-sm text-primary bg-transparent focus:outline-none"
            />
          </div>
        </div>

        {/* Refill trigger setting */}
        <div className="p-3 rounded-2xl bg-surface-container-low flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-on-surface block">Advance Refill Warning</span>
            <span className="text-on-surface-variant text-[11px]">
              Alert before pill stock exhaustion
            </span>
          </div>
          <select
            value={settings.refillThresholdDays}
            onChange={(e) =>
              onUpdateSettings({ ...settings, refillThresholdDays: parseInt(e.target.value) || 3 })
            }
            aria-label="Advance refill warning threshold"
            className="px-2 py-1 rounded-xl bg-surface-container font-bold text-primary focus:outline-none cursor-pointer"
          >
            <option value="2">2 Days</option>
            <option value="3">3 Days (Recommended)</option>
            <option value="5">5 Days</option>
            <option value="7">7 Days</option>
          </select>
        </div>

        {/* Browser Web Notification System Status */}
        <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">web</span>
              <div>
                <span className="font-bold text-xs text-on-surface block">Web Notification System</span>
                <span className="text-[11px] text-on-surface-variant">
                  HTML5 Web Notifications + Actionable In-App Banners
                </span>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                browserPermission === 'granted'
                  ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                  : browserPermission === 'denied'
                  ? 'bg-error-container text-on-error-container'
                  : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              {browserPermission === 'granted'
                ? 'Active'
                : browserPermission === 'denied'
                ? 'Blocked'
                : 'Permission Needed'}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {browserPermission !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="flex-1 py-2 px-3 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">notification_add</span>
                Enable Web Notifications
              </button>
            )}

            {onTestNotification && (
              <button
                type="button"
                onClick={onTestNotification}
                className="flex-1 py-2 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                Test Notification Now
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Smart Brand & Logo Identity */}
      <section className="rounded-3xl bg-surface-container-lowest p-4 border border-surface-container shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
            <h3 className="font-headline font-bold text-sm text-on-surface">Smart Brand & App Logo</h3>
          </div>
          <span className="text-[11px] text-primary font-bold bg-primary-fixed/40 px-2 py-0.5 rounded-full">
            Intelligent Vector
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <SmartLogo size="md" showBeacon={true} pulseAnimated={true} />
            <div className="min-w-0">
              <h4 className="font-headline font-extrabold text-xs text-on-surface truncate">
                MediTrack Smart Emblem
              </h4>
              <p className="text-[11px] text-on-surface-variant line-clamp-1">
                3D Precision Capsule • Telemetry Pulse • Vault Shield
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onOpenSmartLogo) onOpenSmartLogo();
              else setShowLogoModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary-container active:scale-95 transition-all shrink-0 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">palette</span>
            View & Export
          </button>
        </div>
      </section>

      {/* Security & Health Compliance */}
      <section className="rounded-3xl bg-surface-container-lowest p-4 border border-surface-container shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">security</span>
          <h3 className="font-headline font-bold text-sm text-on-surface">Security & Privacy</h3>
        </div>

        <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low">
          <div>
            <span className="font-bold text-xs text-on-surface block">App-Lock (Biometric/PIN)</span>
            <span className="text-[11px] text-on-surface-variant">
              Require authentication to open vault
            </span>
          </div>
          <button
            onClick={() => setAppLockEnabled(!appLockEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
              appLockEnabled ? 'bg-primary' : 'bg-surface-container-high'
            }`}
            type="button"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                appLockEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="space-y-2 pt-1">
          <button
            onClick={() => setShowDisclaimerModal(true)}
            className="w-full p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-left text-xs font-semibold text-on-surface flex items-center justify-between"
            type="button"
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">gavel</span>
              Medical & Health App Privacy Disclosures
            </span>
            <span className="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
          </button>

          <button
            onClick={onExportData}
            className="w-full p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-left text-xs font-semibold text-on-surface flex items-center justify-between"
            type="button"
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">database</span>
              Export Encrypted JSON Backup
            </span>
            <span className="material-symbols-outlined text-[16px] text-outline">download</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Reset application to default demo dataset?')) {
                onResetData();
              }
            }}
            className="w-full p-2.5 rounded-xl bg-error-container/30 hover:bg-error-container/50 text-left text-xs font-semibold text-error flex items-center justify-between"
            type="button"
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              Reset Demo Data
            </span>
            <span className="text-[10px] text-error font-bold">Reset</span>
          </button>
        </div>
      </section>

      {/* Compliance Disclaimer Footnote */}
      <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container text-on-surface-variant text-[11px] leading-relaxed">
        <p className="font-bold text-on-surface mb-0.5">⚠️ Medical Disclaimer</p>
        This application is an organizational companion designed to assist tracking and schedule
        adherence. It does not provide medical diagnosis or replace consultation with licensed
        healthcare professionals.
      </div>

      {/* Disclosure Modal */}
      {showDisclaimerModal && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-5 shadow-2xl flex flex-col gap-3 max-h-[80vh] overflow-y-auto border border-surface-container">
            <div className="flex items-center justify-between border-b border-surface-container pb-2">
              <h3 className="font-headline font-bold text-base text-on-surface">
                Health Privacy & Compliance
              </h3>
              <button
                onClick={() => setShowDisclaimerModal(false)}
                className="w-7 h-7 rounded-full bg-surface-container-low flex items-center justify-center"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="text-xs text-on-surface-variant space-y-2 leading-relaxed">
              <p>
                <strong>On-Device Architecture:</strong> All dosage logs, prescription scans, and
                lab files remain encrypted within your local browser storage by default. No sensitive
                Protected Health Information (PHI) is transmitted to third-party ad networks.
              </p>
              <p>
                <strong>Play Store Health App Policy:</strong> MediTrack provides clear data-safety
                disclosures conforming to Google Play guidelines for medication reminder utilities.
              </p>
              <p>
                <strong>Emergency Notice:</strong> If you or a family member experience an acute
                adverse reaction or overdose, contact emergency medical services immediately.
              </p>
            </div>
            <button
              onClick={() => setShowDisclaimerModal(false)}
              className="mt-2 w-full py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs"
              type="button"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Smart Logo & Brand Details Modal */}
      <SmartLogoModal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
      />
    </div>
  );
};
