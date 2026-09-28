import { Medicine, PatientProfile } from '../types/medicine';

export interface IcsExportOptions {
  medicines: Medicine[];
  patient?: PatientProfile;
  selectedMedicationIds?: string[];
  includePatientInTitle?: boolean;
  alarmMinutesBefore?: number; // 0, 5, 10, 15, 30, or -1 (no alarm)
  durationMode?: 'course' | '30days' | '90days' | '365days' | 'forever';
  markAsFreeTime?: boolean; // TRANSP:TRANSPARENT vs OPAQUE
  customCalendarName?: string;
}

/**
 * Formats a Date object into iCalendar UTC timestamp: YYYYMMDDTHHMMSSZ
 */
export function formatUtcDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Formats a local Date object into iCalendar floating local datetime: YYYYMMDDTHHMMSS
 */
export function formatLocalDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

/**
 * Formats a date into YYYYMMDD
 */
export function formatDateOnly(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate());
}

/**
 * Escapes characters for iCalendar text fields according to RFC 5545
 */
export function escapeIcsText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Folds lines longer than 75 octets per RFC 5545 specification
 */
export function foldIcsLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  parts.push(line.slice(0, 75));
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(' ' + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest.length > 0) {
    parts.push(' ' + rest);
  }
  return parts.join('\r\n');
}

/**
 * Parses time string like "08:00" or "8:00 AM" into hours and minutes
 */
export function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const trimmed = timeStr.trim().toUpperCase();
  const isPM = trimmed.includes('PM');
  const isAM = trimmed.includes('AM');

  const clean = trimmed.replace(/[^\d:]/g, '');
  const [hStr, mStr] = clean.split(':');
  let hours = parseInt(hStr || '8', 10);
  const minutes = parseInt(mStr || '0', 10);

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }

  return { hours: Math.min(23, Math.max(0, hours)), minutes: Math.min(59, Math.max(0, minutes)) };
}

/**
 * Generates an RFC 5545 compliant .ics calendar string for medication dosage schedules
 */
export function generateDosageIcs(options: IcsExportOptions): string {
  const {
    medicines,
    patient,
    selectedMedicationIds,
    includePatientInTitle = false,
    alarmMinutesBefore = 0,
    durationMode = 'course',
    markAsFreeTime = true,
    customCalendarName,
  } = options;

  const now = new Date();
  const dtstamp = formatUtcDateTime(now);

  const calName =
    customCalendarName ||
    (patient
      ? `MediTrack - ${patient.name}'s Dosage Schedule`
      : 'MediTrack Medication Schedule');

  const targetMeds = medicines.filter((m) => {
    if (selectedMedicationIds && selectedMedicationIds.length > 0) {
      return selectedMedicationIds.includes(m.id);
    }
    return m.status === 'active';
  });

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MediTrack//Dosage Schedule RFC5545//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calName)}`,
    `X-WR-CALDESC:${escapeIcsText('Medication dosage schedules and reminders exported from MediTrack')}`,
  ];

  targetMeds.forEach((med) => {
    const times =
      med.scheduledTimes && med.scheduledTimes.length > 0
        ? med.scheduledTimes
        : ['09:00']; // default if PRN or none specified

    // Determine start date
    const startBase = new Date();
    if (med.startDate) {
      const parsedStart = new Date(med.startDate);
      if (!isNaN(parsedStart.getTime())) {
        // If course is currently running, we can start either from original startDate or today
        startBase.setFullYear(parsedStart.getFullYear(), parsedStart.getMonth(), parsedStart.getDate());
      }
    }

    // Determine recurrence rule & end date
    let rrule = 'RRULE:FREQ=DAILY';
    if (durationMode === 'course') {
      if (med.isFixedDuration && (med.endDate || med.durationDays)) {
        let courseEnd: Date;
        if (med.endDate) {
          courseEnd = new Date(med.endDate);
        } else {
          courseEnd = new Date(startBase);
          courseEnd.setDate(courseEnd.getDate() + (med.durationDays || 7));
        }
        courseEnd.setHours(23, 59, 59, 0);
        rrule += `;UNTIL=${formatUtcDateTime(courseEnd)}`;
      }
    } else if (durationMode === '30days') {
      const untilDate = new Date();
      untilDate.setDate(untilDate.getDate() + 30);
      untilDate.setHours(23, 59, 59, 0);
      rrule += `;UNTIL=${formatUtcDateTime(untilDate)}`;
    } else if (durationMode === '90days') {
      const untilDate = new Date();
      untilDate.setDate(untilDate.getDate() + 90);
      untilDate.setHours(23, 59, 59, 0);
      rrule += `;UNTIL=${formatUtcDateTime(untilDate)}`;
    } else if (durationMode === '365days') {
      const untilDate = new Date();
      untilDate.setDate(untilDate.getDate() + 365);
      untilDate.setHours(23, 59, 59, 0);
      rrule += `;UNTIL=${formatUtcDateTime(untilDate)}`;
    }
    // 'forever' keeps RRULE:FREQ=DAILY without UNTIL

    times.forEach((timeStr, idx) => {
      const { hours, minutes } = parseTimeString(timeStr);

      const eventStart = new Date(startBase);
      eventStart.setHours(hours, minutes, 0, 0);

      const eventEnd = new Date(eventStart);
      eventEnd.setMinutes(eventEnd.getMinutes() + 15); // 15-minute appointment block

      const uid = `meditrack-${med.id}-${hours.toString().padStart(2, '0')}${minutes
        .toString()
        .padStart(2, '0')}-${idx}-${eventStart.getTime()}@meditrack.app`;

      const titlePrefix = includePatientInTitle && patient ? `[${patient.name}] ` : '';
      const summary = `💊 ${titlePrefix}Take ${med.name} ${med.strength}${med.strengthUnit}`;

      // Build rich description
      const descLines: string[] = [
        `Medication: ${med.name} ${med.strength}${med.strengthUnit}`,
        `Form: ${med.form.toUpperCase()}`,
        `Dose: ${med.doseAmount || 1} ${med.form}(s)`,
        `Timing: ${med.mealTiming.replace('_', ' ').toUpperCase()}`,
      ];

      if (med.condition) {
        descLines.push(`Condition / Reason: ${med.condition}`);
      }
      if (med.instructions) {
        descLines.push(`Instructions: ${med.instructions}`);
      }
      if (med.doctorName) {
        descLines.push(`Prescriber: ${med.doctorName}`);
      }
      if (med.isFixedDuration) {
        descLines.push(`Course Duration: ${med.durationDays || 7} Days (Fixed Course)`);
      } else {
        descLines.push(`Regimen: Ongoing / Maintenance`);
      }
      if (med.remainingQuantity !== undefined) {
        descLines.push(`Current Inventory: ${med.remainingQuantity} units remaining`);
      }
      descLines.push(`Managed via MediTrack Health Companion`);

      const description = descLines.join('\n');

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${dtstamp}`);
      lines.push(`DTSTART:${formatLocalDateTime(eventStart)}`);
      lines.push(`DTEND:${formatLocalDateTime(eventEnd)}`);
      lines.push(rrule);
      lines.push(`SUMMARY:${escapeIcsText(summary)}`);
      lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
      lines.push(`LOCATION:${escapeIcsText('MediTrack Health')}`);
      lines.push('STATUS:CONFIRMED');
      lines.push(`TRANSP:${markAsFreeTime ? 'TRANSPARENT' : 'OPAQUE'}`);
      lines.push('CATEGORIES:MEDICATION,HEALTH,REMINDER');

      // Alarm / Notification
      if (alarmMinutesBefore >= 0) {
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push(`DESCRIPTION:${escapeIcsText(`Reminder: ${summary}`)}`);
        lines.push(`TRIGGER:-PT${alarmMinutesBefore}M`);
        lines.push('END:VALARM');
      }

      lines.push('END:VEVENT');
    });
  });

  lines.push('END:VCALENDAR');

  // Fold and join with CRLF per RFC 5545
  return lines.map((l) => foldIcsLine(l)).join('\r\n');
}

/**
 * Triggers a browser download of an .ics file
 */
export function downloadIcsFile(fileName: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.setAttribute('download', fileName.endsWith('.ics') ? fileName : `${fileName}.ics`);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Generates a direct "Add to Google Calendar" web link for a specific medicine and dose time
 */
export function createGoogleCalendarLink(
  med: Medicine,
  timeStr: string,
  patientName?: string,
  alarmMins: number = 0
): string {
  const { hours, minutes } = parseTimeString(timeStr);
  const now = new Date();
  const start = new Date(now);
  start.setHours(hours, minutes, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 15);

  const startUtc = formatUtcDateTime(start);
  const endUtc = formatUtcDateTime(end);

  const patientPrefix = patientName ? `[${patientName}] ` : '';
  const title = `💊 ${patientPrefix}Take ${med.name} ${med.strength}${med.strengthUnit}`;
  const details = [
    `Medication: ${med.name} ${med.strength}${med.strengthUnit}`,
    `Dose: ${med.doseAmount || 1} ${med.form} (${med.mealTiming.replace('_', ' ')})`,
    med.condition ? `Condition: ${med.condition}` : '',
    med.instructions ? `Instructions: ${med.instructions}` : '',
    `Managed in MediTrack`,
  ]
    .filter(Boolean)
    .join('\n');

  let recurParam = 'RRULE:FREQ=DAILY';
  if (med.isFixedDuration && (med.endDate || med.durationDays)) {
    const courseEnd = med.endDate
      ? new Date(med.endDate)
      : new Date(now.getTime() + (med.durationDays || 7) * 86400000);
    courseEnd.setHours(23, 59, 59, 0);
    recurParam += `;UNTIL=${formatUtcDateTime(courseEnd)}`;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startUtc}/${endUtc}`,
    details: details,
    recur: recurParam,
    location: 'MediTrack',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
