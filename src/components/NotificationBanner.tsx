import React, { useState, useEffect } from 'react';
import {
  ActiveDoseAlert,
  ActiveCourseAlert,
  notificationService,
} from '../services/notificationService';

interface NotificationBannerProps {
  onDoseAction: (doseId: string, action: 'taken' | 'skipped' | 'snoozed') => void;
  onContactDoctor?: (alert: ActiveCourseAlert) => void;
  onRequestRenewal?: (alert: ActiveCourseAlert) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  onDoseAction,
  onContactDoctor,
  onRequestRenewal,
}) => {
  const [activeAlert, setActiveAlert] = useState<ActiveDoseAlert | null>(null);
  const [activeCourseAlert, setActiveCourseAlert] = useState<ActiveCourseAlert | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() => {
    return notificationService.getPermissionStatus();
  });

  useEffect(() => {
    const unsubDose = notificationService.subscribeInAppAlert((alert) => {
      setActiveAlert(alert);
    });

    const unsubCourse = notificationService.subscribeInAppCourseAlert((alert) => {
      setActiveCourseAlert(alert);
    });

    notificationService.setActionCallback((doseId, action) => {
      onDoseAction(doseId, action);
      notificationService.dismissInAppAlert();
    });

    notificationService.setCourseActionCallback((medId, action, alert) => {
      if (action === 'contact_doctor') {
        if (onContactDoctor) onContactDoctor(alert);
      } else if (action === 'request_renewal' || action === 'view') {
        if (onRequestRenewal) onRequestRenewal(alert);
      }
      notificationService.dismissCourseAlert();
    });

    return () => {
      unsubDose();
      unsubCourse();
    };
  }, [onDoseAction, onContactDoctor, onRequestRenewal]);

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

  const handleDismissDose = () => {
    notificationService.dismissInAppAlert();
  };

  const handleDismissCourse = () => {
    notificationService.dismissCourseAlert();
  };

  // 1. Course Alert takes priority if active, or dose alert
  if (activeCourseAlert) {
    const remainingText =
      activeCourseAlert.daysRemaining === 0
        ? 'Ends today'
        : `${activeCourseAlert.daysRemaining} day${
            activeCourseAlert.daysRemaining > 1 ? 's' : ''
          } remaining`;

    return (
      <div className="fixed top-18 inset-x-0 z-50 px-4 pointer-events-none animate-in slide-in-from-top-4 duration-300">
        <div className="pointer-events-auto max-w-md mx-auto bg-surface-container-lowest rounded-3xl p-4 shadow-2xl border-2 border-amber-500/50 ring-4 ring-amber-500/10 flex flex-col gap-3">
          {/* Header strip */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 animate-pulse border border-amber-500/20">
                <span className="material-symbols-outlined text-[24px]">event_repeat</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    Course Ending Soon
                  </span>
                  <span className="text-xs font-bold text-amber-700">{remainingText}</span>
                </div>
                <h4 className="font-headline font-bold text-base text-on-surface truncate mt-0.5">
                  {activeCourseAlert.medicineName} ({activeCourseAlert.strength})
                </h4>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismissCourse}
              className="w-8 h-8 rounded-full bg-surface-container-low text-on-surface-variant hover:text-on-surface flex items-center justify-center shrink-0"
              aria-label="Dismiss course alert"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Details message */}
          <p className="text-xs text-on-surface-variant bg-surface-container-low p-2.5 rounded-xl font-medium leading-relaxed">
            Day {activeCourseAlert.currentDay} of {activeCourseAlert.durationDays} completed.{' '}
            {activeCourseAlert.doctorName
              ? `Prescribed by ${activeCourseAlert.doctorName}. `
              : ''}
            Contact your doctor or request a course renewal before supplies exhaust.
          </p>

          {/* Action Buttons: Easy Contact Doctor & Request Renewal */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                if (onContactDoctor) onContactDoctor(activeCourseAlert);
                handleDismissCourse();
              }}
              className="h-11 rounded-2xl bg-primary text-on-primary font-headline font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:bg-primary-container active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
              <span>Contact Doctor</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onRequestRenewal) onRequestRenewal(activeCourseAlert);
                handleDismissCourse();
              }}
              className="h-11 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-headline font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">autorenew</span>
              <span>Request Renewal</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Dose Alert
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
                Enable desktop alerts for dose reminders & course completion
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
            onClick={handleDismissDose}
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

