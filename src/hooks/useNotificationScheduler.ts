import { useEffect, useRef } from 'react';
import { DoseItem } from '../types/medicine';
import { notificationService } from '../services/notificationService';

// Helper to convert different time formats ('8:00 AM', '1:30 PM', '13:30', '08:00') into total minutes from midnight
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return -1;
  const str = timeStr.trim().toLowerCase();

  const isPM = str.includes('pm');
  const isAM = str.includes('am');

  const clean = str.replace(/[ap]m/g, '').trim();
  const parts = clean.split(':');
  if (parts.length < 2) return -1;

  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) return -1;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export function useNotificationScheduler(
  doses: DoseItem[],
  onDoseAction: (doseId: string, action: 'taken' | 'skipped' | 'snoozed') => void
) {
  const onDoseActionRef = useRef(onDoseAction);
  onDoseActionRef.current = onDoseAction;

  useEffect(() => {
    notificationService.setActionCallback((doseId, action) => {
      onDoseActionRef.current(doseId, action);
    });

    const checkInterval = setInterval(() => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      doses.forEach((dose) => {
        // Only trigger for pending doses
        if (dose.status !== 'pending') return;

        const scheduledMinutes = parseTimeToMinutes(dose.scheduledTime);
        if (scheduledMinutes === -1) return;

        // Check if within current minute window and not alerted yet today
        const diff = Math.abs(currentMinutes - scheduledMinutes);

        // If scheduled within the last 2 minutes and not yet alerted
        if (diff <= 1) {
          if (!notificationService.hasAlreadyAlerted(dose.id, dose.scheduledTime)) {
            notificationService.triggerDoseNotification(
              dose.id,
              dose.medicineName,
              dose.strength,
              dose.scheduledTime,
              dose.instructions
            );
          }
        }
      });
    }, 10000); // Check every 10 seconds

    return () => {
      clearInterval(checkInterval);
    };
  }, [doses]);

  const testTrigger = (dose: DoseItem) => {
    notificationService.resetAlertForDose(dose.id);
    notificationService.triggerDoseNotification(
      dose.id,
      dose.medicineName,
      dose.strength,
      dose.scheduledTime,
      dose.instructions || `Take 1 ${dose.form} as scheduled.`
    );
  };

  return {
    testTrigger,
  };
}
