import React, { useState } from 'react';
import { Medicine, PatientProfile } from '../types/medicine';
import {
  generateDosageIcs,
  downloadIcsFile,
  createGoogleCalendarLink,
  parseTimeString,
} from '../utils/icsExport';

interface ExportCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicines: Medicine[];
  profiles: PatientProfile[];
  activeProfile: PatientProfile;
  initialSelectedMedId?: string;
}

export const ExportCalendarModal: React.FC<ExportCalendarModalProps> = ({
  isOpen,
  onClose,
  medicines,
  profiles,
  activeProfile,
  initialSelectedMedId,
}) => {
  if (!isOpen) return null;

  // Selected patient profile
  const [selectedPatientId, setSelectedPatientId] = useState<string>(activeProfile.id);

  // Available medicines for selected patient (or all if selected)
  const currentPatientMeds = medicines.filter((m) => {
    if (selectedPatientId === 'all') return true;
    return m.patientId === selectedPatientId || (!m.patientId && selectedPatientId === 'sarah');
  });

  // Selected medication IDs
  const [selectedMedIds, setSelectedMedIds] = useState<string[]>(() => {
    if (initialSelectedMedId) {
      return [initialSelectedMedId];
    }
    // Default to all active medicines for current patient
    const active = currentPatientMeds.filter((m) => m.status === 'active');
    return active.length > 0 ? active.map((m) => m.id) : currentPatientMeds.map((m) => m.id);
  });

  // Settings
  const [durationMode, setDurationMode] = useState<
    'course' | '30days' | '90days' | '365days' | 'forever'
  >('course');
  const [alarmMinutes, setAlarmMinutes] = useState<number>(0);
  const [includePatientName, setIncludePatientName] = useState<boolean>(profiles.length > 1);
  const [markAsFreeTime, setMarkAsFreeTime] = useState<boolean>(true);
  const [showHowToImport, setShowHowToImport] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const selectedPatient = profiles.find((p) => p.id === selectedPatientId) || activeProfile;

  // Toggle selection
  const handleToggleMed = (id: string) => {
    setSelectedMedIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedMedIds(currentPatientMeds.map((m) => m.id));
  };

  const handleDeselectAll = () => {
    setSelectedMedIds([]);
  };

  // Selected medicines count
  const selectedCount = selectedMedIds.length;

  // Generate .ics string
  const handleDownload = () => {
    if (selectedCount === 0) return;

    const icsContent = generateDosageIcs({
      medicines: currentPatientMeds,
      patient: selectedPatientId === 'all' ? undefined : selectedPatient,
      selectedMedicationIds: selectedMedIds,
      includePatientInTitle: includePatientName,
      alarmMinutesBefore: alarmMinutes,
      durationMode,
      markAsFreeTime,
    });

    const patientSlug = selectedPatientId === 'all' ? 'family' : selectedPatient.shortName.toLowerCase();
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `meditrack-schedule-${patientSlug}-${dateStr}.ics`;

    downloadIcsFile(fileName, icsContent);

    setCopiedNotification(`Downloaded ${fileName}! Check your downloads folder.`);
    setTimeout(() => setCopiedNotification(null), 4000);
  };

  // Preview first selected medicine
  const previewMed = currentPatientMeds.find((m) => selectedMedIds.includes(m.id)) || currentPatientMeds[0];

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-surface-container">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-surface-container-low flex items-center justify-between border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[24px]">calendar_add_on</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline font-bold text-base sm:text-lg text-on-surface">
                  Export Dosage Schedule
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-extrabold uppercase tracking-wider">
                  .ICS
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Sync medication alarms to Apple, Google & Outlook calendars
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors"
            type="button"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-on-surface text-xs">
          {/* Patient Selector (if more than 1 patient exists) */}
          {profiles.length > 1 && (
            <div className="space-y-1.5">
              <label className="font-bold text-[11px] uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-primary">person</span>
                Select Patient Profile
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPatientId(p.id);
                      const patientMeds = medicines.filter((m) => m.patientId === p.id);
                      setSelectedMedIds(patientMeds.map((m) => m.id));
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      selectedPatientId === p.id
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span>{p.initials}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatientId('all');
                    setSelectedMedIds(medicines.map((m) => m.id));
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                    selectedPatientId === 'all'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">groups</span>
                  <span>All Patients</span>
                </button>
              </div>
            </div>
          )}

          {/* Medications Selection List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[11px] uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-primary">medication</span>
                Medications to Include ({selectedCount}/{currentPatientMeds.length})
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-primary hover:underline font-bold text-[11px]"
                >
                  Select All
                </button>
                <span className="text-outline text-[10px]">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-on-surface-variant hover:underline font-semibold text-[11px]"
                >
                  Deselect
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {currentPatientMeds.length === 0 ? (
                <div className="p-4 text-center text-on-surface-variant bg-surface-container-low rounded-2xl">
                  No medications found for this profile.
                </div>
              ) : (
                currentPatientMeds.map((med) => {
                  const isChecked = selectedMedIds.includes(med.id);
                  const isCourse = med.isFixedDuration && (med.endDate || med.durationDays);

                  return (
                    <div
                      key={med.id}
                      onClick={() => handleToggleMed(med.id)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'border-primary/40 bg-primary/5 text-on-surface'
                          : 'border-surface-container bg-surface-container-lowest opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isChecked
                              ? 'bg-primary text-on-primary'
                              : 'border-2 border-outline/50 bg-transparent'
                          }`}
                        >
                          {isChecked && (
                            <span className="material-symbols-outlined text-[15px]">check</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-on-surface truncate">
                              {med.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded-md bg-surface-container text-on-surface-variant text-[10px] font-semibold">
                              {med.strength}
                              {med.strengthUnit}
                            </span>
                            {isCourse && (
                              <span className="px-1.5 py-0.2 rounded-md bg-secondary-container text-on-secondary-container text-[9px] font-bold">
                                {med.durationDays || 7}d course
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-on-surface-variant mt-0.5">
                            <span className="capitalize">{med.frequency}</span>
                            <span>•</span>
                            <span>
                              {med.scheduledTimes && med.scheduledTimes.length > 0
                                ? med.scheduledTimes.join(', ')
                                : 'As needed'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Add single med to Google Calendar */}
                      {med.scheduledTimes && med.scheduledTimes.length > 0 && (
                        <a
                          href={createGoogleCalendarLink(
                            med,
                            med.scheduledTimes[0],
                            includePatientName ? selectedPatient?.name : undefined,
                            alarmMinutes
                          )}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors shrink-0"
                          title="Open single event in Google Calendar"
                        >
                          <span className="material-symbols-outlined text-[17px]">open_in_new</span>
                        </a>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Schedule Recurrence & Alarms Configuration Bento */}
          <div className="bg-surface-container-low p-3.5 rounded-2xl border border-surface-container space-y-3">
            <span className="font-bold text-[11px] uppercase tracking-wider text-on-surface-variant block">
              Calendar Options & Notification Rules
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Recurrence Range */}
              <div>
                <label className="text-[11px] text-on-surface-variant font-semibold block mb-1">
                  Schedule Duration
                </label>
                <select
                  value={durationMode}
                  onChange={(e) => setDurationMode(e.target.value as any)}
                  className="w-full p-2 rounded-xl bg-surface-container-lowest border border-surface-container text-xs font-semibold text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="course">Per Prescribed Course (Recommended)</option>
                  <option value="30days">Next 30 Days</option>
                  <option value="90days">Next 90 Days</option>
                  <option value="365days">Full Year (365 Days)</option>
                  <option value="forever">Ongoing Continuous (No End Date)</option>
                </select>
                <p className="text-[10px] text-on-surface-variant mt-1">
                  Acute courses end on scheduled date; ongoing chronic meds continue.
                </p>
              </div>

              {/* Alarm Notification */}
              <div>
                <label className="text-[11px] text-on-surface-variant font-semibold block mb-1">
                  Calendar Reminder Alert
                </label>
                <select
                  value={alarmMinutes}
                  onChange={(e) => setAlarmMinutes(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-surface-container-lowest border border-surface-container text-xs font-semibold text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value={0}>At time of dose (0 min)</option>
                  <option value={5}>5 minutes before</option>
                  <option value={10}>10 minutes before</option>
                  <option value={15}>15 minutes before</option>
                  <option value={30}>30 minutes before</option>
                  <option value={-1}>No alert (Silent)</option>
                </select>
                <p className="text-[10px] text-on-surface-variant mt-1">
                  Pushes native alarm on your phone/watch.
                </p>
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="pt-2 border-t border-surface-container space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includePatientName}
                  onChange={(e) => setIncludePatientName(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-[11px] font-semibold text-on-surface">
                  Include patient name in event titles (e.g. "[{selectedPatient.name}] Take Amoxicillin")
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={markAsFreeTime}
                  onChange={(e) => setMarkAsFreeTime(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-[11px] font-semibold text-on-surface">
                  Mark events as "Available / Free" (won't block work calendar busy slots)
                </span>
              </label>
            </div>
          </div>

          {/* Live Preview Card */}
          {previewMed && (
            <div className="p-3 rounded-2xl bg-surface-container-lowest border border-surface-container-high/60 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-primary">visibility</span>
                  Calendar Entry Preview
                </span>
                <span className="text-primary font-bold">iCal RFC 5545</span>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">event</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-on-surface truncate">
                    💊 {includePatientName ? `[${selectedPatient.name}] ` : ''}Take {previewMed.name}{' '}
                    {previewMed.strength}
                    {previewMed.strengthUnit}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    Daily at{' '}
                    {previewMed.scheduledTimes && previewMed.scheduledTimes.length > 0
                      ? previewMed.scheduledTimes.join(', ')
                      : '09:00 AM'}{' '}
                    • {alarmMinutes >= 0 ? `Alert: ${alarmMinutes === 0 ? 'At dose time' : `${alarmMinutes}m before`}` : 'No alert'}
                  </p>
                  <p className="text-[10px] text-outline mt-0.5 truncate">
                    {previewMed.mealTiming.replace('_', ' ')} • {previewMed.condition || 'Medication'} • {previewMed.doctorName || 'Prescribed'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* How to import collapsible guide */}
          <div className="border border-surface-container rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowHowToImport(!showHowToImport)}
              className="w-full p-2.5 bg-surface-container-low hover:bg-surface-container flex items-center justify-between text-left transition-colors"
            >
              <span className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">help_outline</span>
                How to import .ics into your calendar app
              </span>
              <span className="material-symbols-outlined text-[16px] text-outline">
                {showHowToImport ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {showHowToImport && (
              <div className="p-3 bg-surface-container-lowest space-y-2.5 text-[11px] text-on-surface-variant border-t border-surface-container">
                <div>
                  <strong className="text-on-surface block">🍏 Apple Calendar (iPhone, iPad, Mac)</strong>
                  Tap or double-click the downloaded <code className="bg-surface-container px-1 rounded">.ics</code> file. When prompted, select <em>"Add All Events"</em> to your chosen calendar.
                </div>
                <div>
                  <strong className="text-on-surface block">📅 Google Calendar (Web & Android)</strong>
                  Go to <span className="text-primary font-semibold">calendar.google.com</span> &gt; Gear icon (Settings) &gt; <em>"Import & export"</em> &gt; Upload the <code className="bg-surface-container px-1 rounded">.ics</code> file &gt; Click <em>"Import"</em>.
                </div>
                <div>
                  <strong className="text-on-surface block">📧 Microsoft Outlook</strong>
                  Open Outlook &gt; <em>File &gt; Open & Export &gt; Open Calendar (.ics)</em> or drag and drop into your Outlook Calendar window.
                </div>
              </div>
            )}
          </div>

          {copiedNotification && (
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
              <span>{copiedNotification}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-surface-container-low border-t border-surface-container flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={selectedCount === 0}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-headline font-bold text-xs transition-all shadow-md active:scale-95 ${
              selectedCount === 0
                ? 'bg-surface-container text-outline cursor-not-allowed'
                : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Download .ics Calendar ({selectedCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
