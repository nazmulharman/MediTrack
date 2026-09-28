import React, { useState } from 'react';
import { Medicine, PrescriptionRecord } from '../types/medicine';
import { ActiveCourseAlert, notificationService } from '../services/notificationService';

interface CourseRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicine: Medicine | null;
  alertData?: ActiveCourseAlert | null;
  prescriptions?: PrescriptionRecord[];
  initialMode?: 'contact' | 'renew';
  onRenewCourse: (
    medicineId: string,
    additionalDays: number,
    additionalQuantity: number,
    note?: string
  ) => void;
}

export const CourseRenewalModal: React.FC<CourseRenewalModalProps> = ({
  isOpen,
  onClose,
  medicine,
  alertData,
  prescriptions = [],
  initialMode = 'contact',
  onRenewCourse,
}) => {
  const [mode, setMode] = useState<'contact' | 'renew'>(initialMode);
  const [extensionDays, setExtensionDays] = useState<number>(7);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [renewalNote, setRenewalNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync mode if changed
  React.useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode, isOpen]);

  if (!isOpen || (!medicine && !alertData)) return null;

  const medName = medicine?.name || alertData?.medicineName || 'Medication';
  const medStrength = medicine
    ? `${medicine.strength} ${medicine.strengthUnit}`
    : alertData?.strength || '';
  const medCondition = medicine?.condition || alertData?.condition || 'Prescribed Course';
  const currentDay = medicine?.currentDay || alertData?.currentDay || 1;
  const durationDays = medicine?.durationDays || alertData?.durationDays || 7;
  const daysRemaining = Math.max(0, durationDays - currentDay);
  const progressPct = Math.min(100, Math.round((currentDay / durationDays) * 100));

  // Find associated prescription if any
  const linkedRx = medicine?.prescriptionId
    ? prescriptions.find((p) => p.id === medicine.prescriptionId)
    : undefined;

  const doctorName = medicine?.doctorName || alertData?.doctorName || linkedRx?.doctorName || 'Dr. Marcus Vance, MD';
  const clinic = linkedRx?.clinic || alertData?.clinic || 'St. Jude Family Health Clinic';
  const specialty = linkedRx?.specialty || 'General Practitioner';
  const doctorPhone = alertData?.doctorPhone || '+1 (555) 234-8921';
  const doctorEmail = alertData?.doctorEmail || 'reception@stjudeclinic.med';

  // Calculate needed pills for extension
  const dosesPerDay = (medicine?.scheduledTimes?.length || 1);
  const dosePerIntake = medicine?.doseAmount || 1;
  const additionalQuantity = Math.ceil(extensionDays * dosesPerDay * dosePerIntake);

  // Pre-formatted message for WhatsApp / Email
  const prefilledMessage = `Hello ${doctorName},\n\nI am currently tracking my medicine with MediTrack. My course of ${medName} ${medStrength} (${medCondition}) is on Day ${currentDay} of ${durationDays} (${daysRemaining === 0 ? 'ends today' : `ends in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`}).\n\nPlease advise if I should conclude this medication as planned, or if an extension / prescription renewal is recommended.\n\nPatient: MediTrack Health Vault Record`;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(prefilledMessage);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  const handleConfirmRenewal = () => {
    if (!medicine && !alertData) return;
    const medId = medicine?.id || alertData!.medicineId;
    setIsSubmitting(true);
    onRenewCourse(medId, extensionDays, additionalQuantity, renewalNote);
    notificationService.dismissCourseAlert();
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 z-60 bg-inverse-surface/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-lowest rounded-t-[32px] sm:rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-surface-container">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-surface-container-low border-b border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
              <span className="material-symbols-outlined text-[24px]">event_repeat</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-headline font-bold text-base text-on-surface">
                  Course Nearing Completion
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                  {daysRemaining === 0 ? 'Ends Today' : `${daysRemaining}d Left`}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                {medName} • Day {currentDay} of {durationDays}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Course Progress Card */}
        <div className="px-4 sm:px-5 pt-4">
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-headline font-bold text-sm text-on-surface block">
                  {medName} {medStrength}
                </span>
                <span className="text-[11px] text-on-surface-variant font-medium">
                  {medCondition} • Prescribed by {doctorName}
                </span>
              </div>
              <span className="text-xs font-extrabold text-primary bg-primary-fixed/40 px-2.5 py-1 rounded-full">
                {progressPct}% Finished
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-semibold">
                <span>Day {currentDay}</span>
                <span className="text-amber-700 font-bold">
                  {daysRemaining === 0 ? 'Concludes today' : `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining`}
                </span>
                <span>Day {durationDays}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Toggle: Contact Doctor vs Request Renewal */}
        <div className="px-4 sm:px-5 pt-3">
          <div className="flex items-center p-1 rounded-2xl bg-surface-container border border-surface-container-high">
            <button
              type="button"
              onClick={() => setMode('contact')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'contact'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">call</span>
              <span>Contact Doctor</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('renew')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'renew'
                  ? 'bg-surface-container-lowest text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">autorenew</span>
              <span>Request Renewal</span>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 max-h-[calc(92vh-220px)]">
          {mode === 'contact' ? (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Doctor Card */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center shrink-0">
                    {doctorName.replace(/Dr\.\s*/i, '').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-xs text-on-surface">
                      {doctorName}
                    </h4>
                    <p className="text-[11px] text-on-surface-variant">
                      {specialty} • {clinic}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed-variant text-[10px] font-bold">
                  Prescriber
                </span>
              </div>

              {/* Direct Contact Action Rails */}
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href={`tel:${doctorPhone.replace(/[^\d+]/g, '')}`}
                  className="p-3 rounded-2xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-primary-container active:scale-95 transition-all text-center"
                >
                  <span className="material-symbols-outlined text-[18px]">call</span>
                  <span>Call Doctor Clinic</span>
                </a>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(prefilledMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-90 active:scale-95 transition-all text-center"
                >
                  {/* WhatsApp Icon */}
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.187-2.59-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.353.101.174.449.741.964 1.2 1.042.928 1.637 1.214 1.868 1.33.231.116.366.101.503-.058.137-.159.588-.685.744-.92.156-.235.312-.196.522-.119.21.077 1.33.627 1.558.741.228.114.38.172.436.27.056.098.056.57-.088.975z"/>
                  </svg>
                  <span>WhatsApp Doctor</span>
                </a>
              </div>

              {/* Prefilled Renewal Message Box */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-on-surface">
                    Pre-drafted Clinical Inquiry Message
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copyFeedback ? 'check' : 'content_copy'}
                    </span>
                    {copyFeedback ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-container-lowest text-[11px] font-mono text-on-surface-variant whitespace-pre-line leading-relaxed border border-surface-container">
                  {prefilledMessage}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <a
                  href={`mailto:${doctorEmail}?subject=${encodeURIComponent(
                    `Prescription Inquiry: ${medName} ${medStrength}`
                  )}&body=${encodeURIComponent(prefilledMessage)}`}
                  className="text-primary font-bold hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">mail</span>
                  Send Email to {doctorEmail}
                </a>

                <button
                  type="button"
                  onClick={() => setMode('renew')}
                  className="text-on-surface-variant font-semibold hover:text-on-surface text-xs"
                >
                  Directly Renew Course →
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="text-xs text-on-surface-variant leading-relaxed">
                Extend your dosage course duration and update stock records. This will keep the medicine active on your daily schedule.
              </div>

              {/* Course Extension Duration Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface block">
                  Select Course Extension Duration:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 5, 7, 14].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setExtensionDays(days)}
                      className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-0.5 border text-xs font-bold transition-all ${
                        extensionDays === days
                          ? 'bg-primary text-on-primary border-primary shadow-sm'
                          : 'bg-surface-container-low text-on-surface border-surface-container hover:bg-surface-container'
                      }`}
                    >
                      <span className="text-sm font-headline">+{days}</span>
                      <span className="text-[10px] opacity-80">Days</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Automatic Stock Calculation */}
              <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-on-surface block">
                    Calculated Refill Stock Required:
                  </span>
                  <span className="text-on-surface-variant text-[11px]">
                    Based on {dosesPerDay}x daily intake ({dosePerIntake} unit/dose)
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-extrabold text-xs">
                  +{additionalQuantity} {medicine?.form || 'units'}
                </span>
              </div>

              {/* Clinical Note / Doctor Instruction */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface block">
                  Clinical Renewal Reason or Doctor Note (Optional):
                </label>
                <input
                  type="text"
                  value={renewalNote}
                  onChange={(e) => setRenewalNote(e.target.value)}
                  placeholder="e.g. Extended by Dr. Vance after 5-day follow up visit"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 border border-surface-container"
                />
              </div>

              {/* Confirm Extension Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConfirmRenewal}
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-2xl bg-primary text-on-primary font-headline font-bold text-xs shadow-md hover:bg-primary-container active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isSubmitting ? 'hourglass_top' : 'check_circle'}
                  </span>
                  <span>
                    Confirm & Extend Course (+{extensionDays} Days)
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-surface-container bg-surface-container-low/40 flex items-center justify-between text-xs">
          <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
            MediTrack Course Protection
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
