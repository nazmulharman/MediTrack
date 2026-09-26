import React, { useState, useEffect } from 'react';
import { ActiveDoseAlert, notificationService } from '../services/notificationService';

interface NotificationBannerProps {
  onDoseAction: (doseId: string, action: 'taken' | 'skipped' | 'snoozed') => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ onDoseAction }) => {
  const [activeAlert, setActiveAlert] = useState<ActiveDoseAlert | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() => {
    return notificationService.getPermissionStatus();
  });

  useEffect(() => {
    const unsubscribe = notificationService.subscribeInAppAlert((alert) => {
      setActiveAlert(alert);
    });

    notificationService.setActionCallback((doseId, action) => {
      onDoseAction(doseId, action);
      notificationService.dismissInAppAlert();
    });

    return () => {
      unsubscribe();
    };
  }, [onDoseAction]);

  const handleRequestPermission = async () => {
    const res = await notificationService.requestPermission();
    setPermissionStatus(res);
    if (res === 'granted') {
      notificationService.playGentleChime();
    }
  };

  const handleTaken = () => {
    if (!activeAlert) return;
    onDoseAction(activeAlert.doseId, 'taken');
    notificationService.dismissInAppAlert();
  };

  const handleSkip = () => {
    if (!activeAlert) return;
    onDoseAction(activeAlert.doseId, 'skipped');
    notificationService.dismissInAppAlert();
  };

  const handleSnooze = () => {
    if (!activeAlert) return;
    onDoseAction(activeAlert.doseId, 'snoozed');
    notificationService.dismissInAppAlert();
  };

  const handleDismiss = () => {
    notificationService.dismissInAppAlert();
  };

  if (!activeAlert) {
    // Show gentle permission banner if default/prompt available
    if (permissionStatus === 'default') {
      return (
        <div className="fixed top-20 inset-x-0 z-40 px-4 pointer-events-none">
          <div className="pointer-events-auto max-w-md mx-auto bg-surface-container-lowest/95 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-primary/20 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                notifications_active
              </span>
              <p className="text-xs text-on-surface leading-tight font-medium truncate">
                Enable browser alerts for scheduled dose reminders
              </p>
            </div>
            <button
              type="button"
              onClick={handleRequestPermission}
              className="px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold shrink-0 hover:bg-primary-container active:scale-95 transition-all shadow-sm"
            >
              Enable
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="fixed top-18 inset-x-0 z-50 px-4 pointer-events-none animate-in slide-in-from-top-4 duration-300">
      <div className="pointer-events-auto max-w-md mx-auto bg-surface-container-lowest rounded-3xl p-4 shadow-2xl border-2 border-primary/40 ring-4 ring-primary/10 flex flex-col gap-3">
        {/* Header strip */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 animate-bounce">
              <span className="material-symbols-outlined text-[22px]">alarm</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant">
                  Dose Reminder
                </span>
                <span className="text-xs font-bold text-primary">Due {activeAlert.scheduledTime}</span>
              </div>
              <h4 className="font-headline font-bold text-base text-on-surface truncate mt-0.5">
                {activeAlert.medicineName} ({activeAlert.strength})
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-surface-container-low text-on-surface-variant hover:text-on-surface flex items-center justify-center shrink-0"
            aria-label="Dismiss alert banner"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Message body */}
        <p className="text-xs text-on-surface-variant bg-surface-container-low p-2.5 rounded-xl font-medium">
          {activeAlert.instructions || 'Time to take your scheduled dose as prescribed.'}
        </p>

        {/* Action Buttons: Taken, Skip, Snooze */}
        <div className="grid grid-cols-12 gap-2 pt-1">
          <button
            type="button"
            onClick={handleTaken}
            className="col-span-6 h-11 rounded-xl bg-primary text-on-primary font-headline font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:bg-primary-container active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>Taken</span>
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="col-span-3 h-11 rounded-xl bg-surface-container-low text-error font-semibold text-xs flex items-center justify-center gap-1 hover:bg-error-container hover:text-on-error-container active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">cancel</span>
            <span>Skip</span>
          </button>

          <button
            type="button"
            onClick={handleSnooze}
            className="col-span-3 h-11 rounded-xl bg-surface-container-low text-on-surface font-semibold text-xs flex items-center justify-center gap-1 hover:bg-surface-container active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">snooze</span>
            <span>15m</span>
          </button>
        </div>
      </div>
    </div>
  );
};
