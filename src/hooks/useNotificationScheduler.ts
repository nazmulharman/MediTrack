import { useEffect, useRef } from 'react';
import { DoseItem, Medicine } from '../types/medicine';
import { notificationService, ActiveCourseAlert } from '../services/notificationService';

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
  onDoseAction: (doseId: string, action: 'taken' | 'skipped' | 'snoozed') => void,
  medicines: Medicine[] = []
) {
  const onDoseActionRef = useRef(onDoseAction);
  onDoseActionRef.current = onDoseAction;

  // Check medicine courses nearing completion (<= 2 days remaining)
  const checkCourseAlerts = (medsList: Medicine[]) => {
    medsList.forEach((med) => {
      if (
        med.status === 'active' &&
        med.isFixedDuration &&
        med.durationDays &&
        med.durationDays > 0
      ) {
        const curDay = med.currentDay || 1;
        const daysRemaining = Math.max(0, med.durationDays - curDay);

        // Nearing completion: 0, 1, or 2 days left
        if (daysRemaining <= 2) {
          if (!notificationService.hasAlreadyAlertedCourse(med.id, curDay, med.durationDays)) {
            notificationService.triggerCourseNearingCompletionNotification({
              id: `course-${med.id}-${curDay}`,
              medicineId: med.id,
              medicineName: med.name,
              strength: `${med.strength}${med.strengthUnit}`,
              form: med.form,
              currentDay: curDay,
              durationDays: med.durationDays,
              daysRemaining,
              doctorName: med.doctorName || 'Dr. Marcus Vance, MD',
              condition: med.condition,
              timestamp: Date.now(),
            });
          }
        }
      }
    });
  };

  useEffect(() => {
    notificationService.setActionCallback((doseId, action) => {
      onDoseActionRef.current(doseId, action);
    });

    // Check course alerts on mount and when medicines change
    if (medicines.length > 0) {
      checkCourseAlerts(medicines);
    }

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
  }, [doses, medicines]);

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

  const testCourseTrigger = (targetMed?: Medicine) => {
    const med =
      targetMed ||
      medicines.find((m) => m.isFixedDuration && m.status === 'active') ||
      medicines[0];
    if (med) {
      notificationService.resetCourseAlert(med.id);
      const curDay = med.currentDay || Math.max(1, (med.durationDays || 7) - 1);
      const duration = med.durationDays || 7;
      const daysRemaining = Math.max(0, duration - curDay);
      notificationService.triggerCourseNearingCompletionNotification(
        {
          id: `course-test-${med.id}-${Date.now()}`,
          medicineId: med.id,
          medicineName: med.name,
          strength: `${med.strength}${med.strengthUnit}`,
          form: med.form,
          currentDay: curDay,
          durationDays: duration,
          daysRemaining: daysRemaining === 0 ? 1 : daysRemaining,
          doctorName: med.doctorName || 'Dr. Marcus Vance, MD',
          condition: med.condition,
          timestamp: Date.now(),
        },
        true
      );
    }
  };

  return {
    testTrigger,
    testCourseTrigger,
  };
}

