// Notification service supporting both HTML5 Web Notifications and in-app interactive toasts

export interface ActiveDoseAlert {
  id: string;
  doseId: string;
  medicineName: string;
  strength: string;
  scheduledTime: string;
  instructions?: string;
  timestamp: number;
}

export interface ActiveCourseAlert {
  id: string;
  medicineId: string;
  medicineName: string;
  strength: string;
  form: string;
  currentDay: number;
  durationDays: number;
  daysRemaining: number;
  doctorName: string;
  doctorPhone?: string;
  doctorEmail?: string;
  clinic?: string;
  condition?: string;
  timestamp: number;
}

type NotificationActionCallback = (doseId: string, action: 'taken' | 'skipped' | 'snoozed') => void;
type CourseActionCallback = (
  medicineId: string,
  action: 'contact_doctor' | 'request_renewal' | 'view' | 'dismiss',
  alert: ActiveCourseAlert
) => void;

class NotificationService {
  private actionCallback: NotificationActionCallback | null = null;
  private courseActionCallback: CourseActionCallback | null = null;
  private alertedDoseIds: Set<string> = new Set();
  private alertedCourseKeys: Set<string> = new Set();
  private inAppAlertListeners: ((alert: ActiveDoseAlert | null) => void)[] = [];
  private currentInAppAlert: ActiveDoseAlert | null = null;

  private inAppCourseListeners: ((alert: ActiveCourseAlert | null) => void)[] = [];
  private currentInAppCourseAlert: ActiveCourseAlert | null = null;

  private audioCtx: AudioContext | null = null;

  constructor() {
    // Check if permission already granted
  }

  public setActionCallback(cb: NotificationActionCallback) {
    this.actionCallback = cb;
  }

  public setCourseActionCallback(cb: CourseActionCallback) {
    this.courseActionCallback = cb;
  }

  public subscribeInAppAlert(listener: (alert: ActiveDoseAlert | null) => void) {
    this.inAppAlertListeners.push(listener);
    listener(this.currentInAppAlert);
    return () => {
      this.inAppAlertListeners = this.inAppAlertListeners.filter((l) => l !== listener);
    };
  }

  public subscribeInAppCourseAlert(listener: (alert: ActiveCourseAlert | null) => void) {
    this.inAppCourseListeners.push(listener);
    listener(this.currentInAppCourseAlert);
    return () => {
      this.inAppCourseListeners = this.inAppCourseListeners.filter((l) => l !== listener);
    };
  }

  public async requestPermission(): Promise<NotificationPermission> {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        console.warn('Web Notifications not supported in this browser.');
        return 'denied';
      }

      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return 'denied';
    }
  }

  public getPermissionStatus(): NotificationPermission {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
      return Notification.permission;
    } catch {
      return 'denied';
    }
  }

  public playGentleChime() {
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      if (this.audioCtx.state === 'running') {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';

        // Soft medical two-tone chime
        const now = this.audioCtx.currentTime;
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.15); // A5

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.65);
      }
    } catch {
      // Audio not permitted or user hasn't interacted
    }
  }

  public triggerDoseNotification(
    doseId: string,
    medicineName: string,
    strength: string,
    scheduledTime: string,
    instructions?: string,
    playSound: boolean = true
  ) {
    const alertId = `${doseId}-${scheduledTime}`;
    this.alertedDoseIds.add(alertId);

    // Play restorative chime if requested and allowed
    if (playSound) {
      this.playGentleChime();
    }

    // 1. Try Browser Web Notification (ServiceWorker or new Notification)
    try {
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        const notifTitle = `Time for ${medicineName} (${strength})`;
        const notifBody = `Scheduled: ${scheduledTime}. ${instructions || 'Tap to record dosage.'}`;
        const notifIcon =
          'https://lh3.googleusercontent.com/aida/AEtjO1WNXTutzSlNL4HTcW-feim518dpH3ZzUlt8NEn1TlTLI-lAWY8MY8NPTtPajx4P5eqoP7Z0yH2Uf6ZScVEm7Nu5cWsDWrG4jxdK6RUZ_ZKnpftZCQs3Se53yujEsu5RRIVBFGJ5T6SMGDvzihJPiA0FX0c9dJPlNOZd5bVhcLJGtbLWgURrfSrYfEwkkhjmMsUl0wTm_NqDHTmo1aecWosvlCH29EV55XRyN4a3WZoFizdNUO8KG5ihFOg';

        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready
            .then((reg) => {
              reg.showNotification(notifTitle, {
                body: notifBody,
                icon: notifIcon,
                tag: `dose-${doseId}`,
                actions: [
                  { action: 'taken', title: '✅ Taken' },
                  { action: 'skip', title: '❌ Skip' },
                ],
              } as any);
            })
            .catch(() => {});
        } else {
          // Standard HTML5 Notification (actions must NOT be passed to avoid TypeError in Chrome)
          const notification = new Notification(notifTitle, {
            body: notifBody,
            icon: notifIcon,
            tag: `dose-${doseId}`,
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        }
      }
    } catch (err) {
      console.warn('Native notification failed, relying on in-app notification banner:', err);
    }

    // 2. Always show high-fidelity in-app notification banner with "Taken" and "Skip" action buttons
    const alertData: ActiveDoseAlert = {
      id: alertId,
      doseId,
      medicineName,
      strength,
      scheduledTime,
      instructions,
      timestamp: Date.now(),
    };

    this.currentInAppAlert = alertData;
    this.inAppAlertListeners.forEach((fn) => fn(alertData));
  }

  public triggerCourseNearingCompletionNotification(
    alert: ActiveCourseAlert,
    playSound: boolean = false
  ) {
    const alertKey = `${alert.medicineId}-${alert.currentDay}-${alert.durationDays}`;
    this.alertedCourseKeys.add(alertKey);

    if (playSound) {
      this.playGentleChime();
    }

    // 1. Desktop HTML5 Web Notification with Action Buttons
    try {
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        const notifTitle = `⚠️ Course Ending Soon: ${alert.medicineName}`;
        const dayLabel = `Day ${alert.currentDay} of ${alert.durationDays}`;
        const remainingLabel =
          alert.daysRemaining === 0 ? 'Ends today' : `${alert.daysRemaining} days left`;
        const doctorLine = alert.doctorName ? ` (Prescribed by ${alert.doctorName})` : '';
        const notifBody = `${dayLabel} • ${remainingLabel}${doctorLine}. Tap to contact doctor or request renewal.`;
        const notifIcon =
          'https://lh3.googleusercontent.com/aida/AEtjO1WNXTutzSlNL4HTcW-feim518dpH3ZzUlt8NEn1TlTLI-lAWY8MY8NPTtPajx4P5eqoP7Z0yH2Uf6ZScVEm7Nu5cWsDWrG4jxdK6RUZ_ZKnpftZCQs3Se53yujEsu5RRIVBFGJ5T6SMGDvzihJPiA0FX0c9dJPlNOZd5bVhcLJGtbLWgURrfSrYfEwkkhjmMsUl0wTm_NqDHTmo1aecWosvlCH29EV55XRyN4a3WZoFizdNUO8KG5ihFOg';

        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready
            .then((reg) => {
              reg.showNotification(notifTitle, {
                body: notifBody,
                icon: notifIcon,
                tag: `course-nearing-${alert.medicineId}`,
                actions: [
                  { action: 'contact_doctor', title: '📞 Contact Doctor' },
                  { action: 'request_renewal', title: '🔄 Request Renewal' },
                ],
              } as any);
            })
            .catch(() => {});
        } else {
          // Standard in-window Notification without actions property (to avoid Chrome TypeError)
          const notification = new Notification(notifTitle, {
            body: notifBody,
            icon: notifIcon,
            tag: `course-nearing-${alert.medicineId}`,
          });

          notification.onclick = () => {
            window.focus();
            this.courseActionCallback?.(alert.medicineId, 'view', alert);
            notification.close();
          };
        }
      }
    } catch (err) {
      console.warn('Native course notification failed, falling back to in-app banner:', err);
    }

    // 2. In-App Interactive Banner
    this.currentInAppCourseAlert = alert;
    this.inAppCourseListeners.forEach((fn) => fn(alert));
  }

  public triggerCourseStopReminder(
    medicineName: string,
    durationDays: number,
    doctorName?: string,
    playSound: boolean = false
  ) {
    if (playSound) {
      this.playGentleChime();
    }
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notifTitle = `🛑 Course Stop Alert: ${medicineName}`;
        const notifOptions: NotificationOptions = {
          body: `Your prescribed ${durationDays}-day course of ${medicineName} has completed. Please stop taking this medication ${doctorName ? 'as directed by ' + doctorName : 'as prescribed'}.`,
          icon: 'https://lh3.googleusercontent.com/aida/AEtjO1WNXTutzSlNL4HTcW-feim518dpH3ZzUlt8NEn1TlTLI-lAWY8MY8NPTtPajx4P5eqoP7Z0yH2Uf6ZScVEm7Nu5cWsDWrG4jxdK6RUZ_ZKnpftZCQs3Se53yujEsu5RRIVBFGJ5T6SMGDvzihJPiA0FX0c9dJPlNOZd5bVhcLJGtbLWgURrfSrYfEwkkhjmMsUl0wTm_NqDHTmo1aecWosvlCH29EV55XRyN4a3WZoFizdNUO8KG5ihFOg',
          tag: `course-stop-${medicineName}`,
        };
        new Notification(notifTitle, notifOptions);
      } catch (e) {
        console.warn('Stop course notification error:', e);
      }
    }
  }

  public dismissInAppAlert() {
    this.currentInAppAlert = null;
    this.inAppAlertListeners.forEach((fn) => fn(null));
  }

  public dismissCourseAlert() {
    this.currentInAppCourseAlert = null;
    this.inAppCourseListeners.forEach((fn) => fn(null));
  }

  public hasAlreadyAlerted(doseId: string, scheduledTime: string): boolean {
    return this.alertedDoseIds.has(`${doseId}-${scheduledTime}`);
  }

  public hasAlreadyAlertedCourse(medicineId: string, currentDay: number, durationDays: number): boolean {
    return this.alertedCourseKeys.has(`${medicineId}-${currentDay}-${durationDays}`);
  }

  public resetAlertForDose(doseId: string) {
    // Allows re-testing
    this.alertedDoseIds.forEach((key) => {
      if (key.startsWith(doseId)) {
        this.alertedDoseIds.delete(key);
      }
    });
  }

  public resetCourseAlert(medicineId?: string) {
    if (medicineId) {
      this.alertedCourseKeys.forEach((key) => {
        if (key.startsWith(medicineId)) {
          this.alertedCourseKeys.delete(key);
        }
      });
    } else {
      this.alertedCourseKeys.clear();
    }
  }
}

export const notificationService = new NotificationService();
