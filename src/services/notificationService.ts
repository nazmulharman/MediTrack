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

type NotificationActionCallback = (doseId: string, action: 'taken' | 'skipped' | 'snoozed') => void;

class NotificationService {
  private actionCallback: NotificationActionCallback | null = null;
  private alertedDoseIds: Set<string> = new Set();
  private inAppAlertListeners: ((alert: ActiveDoseAlert | null) => void)[] = [];
  private currentInAppAlert: ActiveDoseAlert | null = null;
  private audioCtx: AudioContext | null = null;

  constructor() {
    // Check if permission already granted
  }

  public setActionCallback(cb: NotificationActionCallback) {
    this.actionCallback = cb;
  }

  public subscribeInAppAlert(listener: (alert: ActiveDoseAlert | null) => void) {
    this.inAppAlertListeners.push(listener);
    listener(this.currentInAppAlert);
    return () => {
      this.inAppAlertListeners = this.inAppAlertListeners.filter((l) => l !== listener);
    };
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Web Notifications not supported in this browser.');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return 'default';
    }
  }

  public getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  public playGentleChime() {
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

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
    } catch {
      // Audio not permitted or user hasn't interacted
    }
  }

  public triggerDoseNotification(
    doseId: string,
    medicineName: string,
    strength: string,
    scheduledTime: string,
    instructions?: string
  ) {
    const alertId = `${doseId}-${scheduledTime}`;
    this.alertedDoseIds.add(alertId);

    // Play restorative chime
    this.playGentleChime();

    // 1. Try Browser Web Notification (ServiceWorker or new Notification)
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notifTitle = `Time for ${medicineName} (${strength})`;
        const notifOptions: NotificationOptions & { actions?: { action: string; title: string }[]; renotify?: boolean } = {
          body: `Scheduled: ${scheduledTime}. ${instructions || 'Tap to record dosage.'}`,
          icon: 'https://lh3.googleusercontent.com/aida/AEtjO1WNXTutzSlNL4HTcW-feim518dpH3ZzUlt8NEn1TlTLI-lAWY8MY8NPTtPajx4P5eqoP7Z0yH2Uf6ZScVEm7Nu5cWsDWrG4jxdK6RUZ_ZKnpftZCQs3Se53yujEsu5RRIVBFGJ5T6SMGDvzihJPiA0FX0c9dJPlNOZd5bVhcLJGtbLWgURrfSrYfEwkkhjmMsUl0wTm_NqDHTmo1aecWosvlCH29EV55XRyN4a3WZoFizdNUO8KG5ihFOg',
          tag: `dose-${doseId}`,
          renotify: true,
          actions: [
            { action: 'taken', title: '✅ Taken' },
            { action: 'skip', title: '❌ Skip' },
          ],
        };

        // If service worker supports showNotification
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(notifTitle, notifOptions);
          });
        } else {
          // Standard HTML5 Notification
          const notification = new Notification(notifTitle, notifOptions);

          notification.onclick = () => {
            window.focus();
            notification.close();
          };

          // Some modern Chromium browsers support action click events
          (notification as unknown as { addEventListener: Function }).addEventListener?.('action', (event: { action: string }) => {
            if (event.action === 'taken') {
              this.actionCallback?.(doseId, 'taken');
            } else if (event.action === 'skip') {
              this.actionCallback?.(doseId, 'skipped');
            }
            notification.close();
          });
        }
      } catch (err) {
        console.warn('Native notification failed, relying on in-app notification banner:', err);
      }
    }

    // 2. Always show high-fidelity in-app notification banner with "Taken" and "Skip" action buttons
    // This guarantees full functionality in iframe previews, mobile Safari, and environments without system notification permissions
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

  public triggerCourseStopReminder(medicineName: string, durationDays: number, doctorName?: string) {
    this.playGentleChime();
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

  public hasAlreadyAlerted(doseId: string, scheduledTime: string): boolean {
    return this.alertedDoseIds.has(`${doseId}-${scheduledTime}`);
  }

  public resetAlertForDose(doseId: string) {
    // Allows re-testing
    this.alertedDoseIds.forEach((key) => {
      if (key.startsWith(doseId)) {
        this.alertedDoseIds.delete(key);
      }
    });
  }
}

export const notificationService = new NotificationService();
