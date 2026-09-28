import React, { useState } from 'react';
import { PatientProfile, DoseItem, Medicine, HealthVitalLog } from '../types/medicine';
import { formatFraction, roundFraction, COMMON_FRACTION_DOSES } from '../utils/fractionUtils';

interface TodayTabProps {
  profiles: PatientProfile[];
  activeProfile: PatientProfile;
  onSelectProfile: (profile: PatientProfile) => void;
  onOpenProfilesModal: () => void;
  doses: DoseItem[];
  medicines: Medicine[];
  vitals?: HealthVitalLog[];
  onUpdateDoseStatus: (doseId: string, status: 'taken' | 'pending' | 'skipped' | 'snoozed', amountTaken?: number) => void;
  onOpenAddMedicine: () => void;
  onOpenScanner: () => void;
  onOpenRefill: (medicine: Medicine) => void;
  onSelectMedicine: (medicine: Medicine) => void;
  onEditMedicine?: (medicine: Medicine) => void;
  onUpdateConsumed?: (medId: string, newConsumed: number) => void;
  onOpenVitals?: () => void;
  onDiscontinueCourse?: (medId: string) => void;
  onTestNotification?: (dose: DoseItem) => void;
  onOpenExportCalendar?: () => void;
  onContactDoctor?: (med: Medicine) => void;
  onRequestRenewal?: (med: Medicine) => void;
}

export const TodayTab: React.FC<TodayTabProps> = ({
  profiles,
  activeProfile,
  onSelectProfile,
  onOpenProfilesModal,
  doses,
  medicines,
  vitals = [],
  onUpdateDoseStatus,
  onOpenAddMedicine,
  onOpenScanner,
  onOpenRefill,
  onSelectMedicine,
  onEditMedicine,
  onUpdateConsumed,
  onOpenVitals,
  onDiscontinueCourse,
  onTestNotification,
  onOpenExportCalendar,
  onContactDoctor,
  onRequestRenewal,
}) => {
  // Alert dismiss states
  const [dismissRefillAlert, setDismissRefillAlert] = useState(false);
  const [dismissExpiryAlert, setDismissExpiryAlert] = useState(false);
  const [dismissCourseStopAlert, setDismissCourseStopAlert] = useState<Record<string, boolean>>({});
  const [snoozedDoses, setSnoozedDoses] = useState<Record<string, boolean>>({});
  const [snoozeNotice, setSnoozeNotice] = useState<string>('');

  // How much consumed quick logger modal
  const [isLogConsumedOpen, setIsLogConsumedOpen] = useState(false);
  const [selectedMedForConsumption, setSelectedMedForConsumption] = useState<string>('');
  const [consumedAmountToLog, setConsumedAmountToLog] = useState<number>(1.0);
  const [consumptionSuccessMsg, setConsumptionSuccessMsg] = useState<string>('');
  const [activeFractionPickerDoseId, setActiveFractionPickerDoseId] = useState<string | null>(null);

  // Calculate adherence stats
  const totalDoses = doses.length;
  const takenDoses = doses.filter((d) => d.status === 'taken').length;
  const adherencePercentage =
    totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;
  const remainingDoses = totalDoses - takenDoses;

  // Active medicines count
  const activeRxCount = medicines.filter((m) => m.status === 'active').length;

  // Fixed duration courses ending soon or complete (Need reminder to stop after specific days)
  const courseEndingMeds = medicines.filter((m) => {
    if (m.status !== 'active' || !m.isFixedDuration || !m.durationDays) return false;
    const current = m.currentDay || 1;
    return current >= (m.durationDays - 2);
  });

  // Consumed today
  const consumedDosesToday = doses.filter((d) => d.status === 'taken');
  const totalPillsConsumedToday = roundFraction(
    consumedDosesToday.reduce((sum, d) => sum + (d.consumedAmount || d.amount || 1), 0)
  );

  // Latest Vitals for this active profile
  const patientVitals = vitals.filter((v) => v.patientId === activeProfile.id);
  const latestSugar = patientVitals.find((v) => v.type === 'blood_sugar');
  const latestBP = patientVitals.find((v) => v.type === 'blood_pressure');

  // Filter doses by time routine
  const morningDoses = doses.filter((d) => d.timeSlot === 'morning');
  const afternoonDoses = doses.filter((d) => d.timeSlot === 'afternoon');
  const eveningDoses = doses.filter((d) => d.timeSlot === 'evening');
  const nightDoses = doses.filter((d) => d.timeSlot === 'night');

  const allMorningTaken =
    morningDoses.length > 0 && morningDoses.every((d) => d.status === 'taken');

  // Low stock medicines (remainingQuantity <= refillTrigger)
  const lowStockMeds = medicines.filter(
    (m) => m.status === 'active' && m.refillTrigger && m.remainingQuantity <= m.refillTrigger
  );

  // Expiring soon medicines (within 30 days)
  const expiringMeds = medicines.filter((m) => {
    if (m.status !== 'active' || !m.expiryDate) return false;
    const diff = Math.ceil((new Date(m.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 && diff <= 30;
  });

  return (
    <div className="flex flex-col w-full space-y-5 pb-28 pt-2">
      {/* Profile Switching Segmented Pills */}
      <section aria-label="Care Profiles" className="flex flex-col space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
            Active Patient
          </span>
          <button
            onClick={onOpenProfilesModal}
            className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:opacity-80 active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">group_add</span>
            <span>Manage</span>
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar -mx-4 px-4">
          {profiles.map((profile) => {
            const isActive = profile.id === activeProfile.id;
            return (
              <button
                key={profile.id}
                onClick={() => onSelectProfile(profile)}
                type="button"
                className={`flex items-center gap-2 h-10 pl-1.5 pr-4 rounded-full shrink-0 transition-transform active:scale-95 ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-sm font-semibold'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {profile.avatarUrl ? (
                  <img
                    alt={profile.name}
                    className="w-7 h-7 rounded-full object-cover"
                    src={profile.avatarUrl}
                  />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold text-[11px] flex items-center justify-center">
                    {profile.initials}
                  </span>
                )}
                <span className="text-xs font-semibold">{profile.name}</span>
                {isActive && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold">
                    {takenDoses}/{totalDoses}
                  </span>
                )}
                {profile.hasAlerts && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-error shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Daily Status Summary Bento */}
      <section aria-label="Daily Status Summary" className="grid grid-cols-5 gap-3">
        {/* Adherence Ring Card */}
        <div className="col-span-3 bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden border border-surface-container">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Daily Adherence
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-bold">
              {adherencePercentage >= 65 ? 'On Track' : 'Needs Action'}
            </span>
          </div>

          <div className="flex items-center gap-3 my-2">
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
                <circle
                  className="text-surface-container"
                  cx="24"
                  cy="24"
                  fill="none"
                  r="19"
                  stroke="currentColor"
                  strokeWidth="4.5"
                />
                <circle
                  className="text-primary transition-all duration-700 ease-out"
                  cx="24"
                  cy="24"
                  fill="none"
                  r="19"
                  stroke="currentColor"
                  strokeDasharray="119.38"
                  strokeDashoffset={119.38 - (119.38 * adherencePercentage) / 100}
                  strokeLinecap="round"
                  strokeWidth="4.5"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-headline font-bold text-base text-on-surface leading-none">
                  {adherencePercentage}
                  <span className="text-[11px] font-semibold">%</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-headline font-bold text-sm text-on-surface truncate">
                <span className="text-primary font-bold">{takenDoses}</span> of {totalDoses} taken
              </span>
              <span className="text-xs text-on-surface-variant truncate">
                {remainingDoses} remaining today
              </span>
            </div>
          </div>

          <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${adherencePercentage}%` }}
            />
          </div>
        </div>

        {/* Active Courses & Next Alarm */}
        <div className="col-span-2 flex flex-col gap-2.5">
          <div
            onClick={() => {
              if (medicines.length > 0) {
                onSelectMedicine(medicines[0]);
              } else {
                onOpenAddMedicine();
              }
            }}
            className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm flex-1 flex flex-col justify-between border border-surface-container cursor-pointer hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-primary text-[20px]">pill</span>
              <span className="material-symbols-outlined text-on-surface-variant text-[16px]">
                chevron_right
              </span>
            </div>
            <div>
              <span className="font-headline font-extrabold text-2xl text-on-surface">
                {activeRxCount}
              </span>
              <p className="text-[11px] text-on-surface-variant font-medium leading-tight">
                Active Rx Courses
              </p>
            </div>
          </div>

          <div className="bg-surface-container-high rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] font-bold text-on-secondary-fixed-variant">
              Next in 45m
            </span>
            <span className="material-symbols-outlined text-on-secondary-fixed-variant text-[16px]">
              alarm
            </span>
          </div>
        </div>
      </section>

      {/* Urgent Clinical Alert Banners */}
      <section aria-label="Clinical Reminders and Alerts" className="flex flex-col space-y-2.5">
        {/* Course Discontinuation / Stop Reminders */}
        {courseEndingMeds.map((med) => {
          if (dismissCourseStopAlert[med.id]) return null;
          const isComplete = (med.currentDay || 1) >= (med.durationDays || 7);
          const daysLeft = Math.max(0, (med.durationDays || 7) - (med.currentDay || 1));

          return (
            <div
              key={`stop-alert-${med.id}`}
              className="relative bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm overflow-hidden border border-primary/30"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-error animate-pulse" />
              <div className="flex items-start gap-3 pl-1">
                <div className="w-9 h-9 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">timer_off</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-extrabold uppercase tracking-wider">
                      {isComplete ? 'Course Complete • Stop Today' : `Stop in ${daysLeft} days`}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">
                      Day {med.currentDay || 5} of {med.durationDays || 7}
                    </span>
                  </div>
                  <p className="font-headline font-bold text-sm text-on-surface mt-1 truncate">
                    {med.name} ({med.strength}{med.strengthUnit})
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">
                    {isComplete
                      ? `Your prescribed ${med.durationDays}-day course finishes today. Discontinue medication to prevent antibiotic resistance.`
                      : `Scheduled course concludes on ${med.endDate || 'Oct 28'}. Do not prolong therapy without clinical consultation.`}
                  </p>
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    {onContactDoctor && (
                      <button
                        onClick={() => onContactDoctor(med)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary-container active:scale-95 transition-all"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[15px]">call</span>
                        <span>Contact Doctor</span>
                      </button>
                    )}
                    {onRequestRenewal && (
                      <button
                        onClick={() => onRequestRenewal(med)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[15px]">autorenew</span>
                        <span>Request Renewal</span>
                      </button>
                    )}
                    {onDiscontinueCourse && (
                      <button
                        onClick={() => onDiscontinueCourse(med.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[15px]">check_circle</span>
                        <span>Complete & Stop Course</span>
                      </button>
                    )}
                    <button
                      onClick={() => setDismissCourseStopAlert((prev) => ({ ...prev, [med.id]: true }))}
                      className="px-2.5 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant text-xs font-semibold hover:bg-surface-container active:scale-95 transition-all"
                      type="button"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Low Stock Alert */}
        {lowStockMeds.length > 0 && !dismissRefillAlert && (
          <div className="relative bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm overflow-hidden border border-surface-container">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-error" />
            <div className="flex items-start gap-3 pl-1">
              <div className="w-9 h-9 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">inventory_2</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-extrabold uppercase">
                    Refill Needed
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">Low Stock</span>
                </div>
                <p className="font-headline font-bold text-sm text-on-surface mt-1 truncate">
                  {lowStockMeds[0].name} {lowStockMeds[0].strength}{lowStockMeds[0].strengthUnit}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Only {formatFraction(lowStockMeds[0].remainingQuantity)} {lowStockMeds[0].form}s remaining in dispenser.
                </p>
                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    onClick={() => onOpenRefill(lowStockMeds[0])}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[15px]">local_pharmacy</span>
                    <span>Order Refill</span>
                  </button>
                  <button
                    onClick={() => setDismissRefillAlert(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant text-xs font-semibold hover:bg-surface-container active:scale-95 transition-all"
                    type="button"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expiration Warning Alert */}
        {expiringMeds.length > 0 && !dismissExpiryAlert && (
          <div className="relative bg-surface-container-low rounded-2xl p-3.5 flex items-start gap-3 border border-surface-container">
            <div className="w-8 h-8 rounded-full bg-surface-container text-tertiary flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[18px]">event_busy</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-on-surface truncate">
                  {expiringMeds[0].name} {expiringMeds[0].strength}{expiringMeds[0].strengthUnit}
                </p>
                <span className="text-[11px] font-semibold text-on-surface-variant">{expiringMeds[0].expiryDate}</span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Package expiration approaching. Verify supply and plan safe disposal.
              </p>
            </div>
            <button
              onClick={() => setDismissExpiryAlert(true)}
              aria-label="Dismiss note"
              className="text-on-surface-variant hover:text-on-surface p-1"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}
      </section>

      {/* Daily Vitals (Sugar & Blood Pressure) Tracker Widget */}
      <section aria-label="Daily Vitals" className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm border border-surface-container flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">vital_signs</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-sm text-on-surface">Daily Vitals Tracker</h3>
              <p className="text-[11px] text-on-surface-variant font-medium">Daily Blood Sugar & Blood Pressure</p>
            </div>
          </div>
          {onOpenVitals && (
            <button
              onClick={onOpenVitals}
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              <span>Log Sugar & BP</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Blood Sugar status */}
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex flex-col justify-between">
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Blood Sugar</span>
            <div className="mt-1">
              <span className="font-headline font-extrabold text-lg text-on-surface">
                {latestSugar ? `${latestSugar.sugarValue} ` : '-- '} <span className="text-xs font-semibold text-outline">mg/dL</span>
              </span>
              <p className="text-[10px] font-bold text-secondary truncate mt-0.5">
                {latestSugar ? `${latestSugar.sugarContext?.replace('_', ' ').toUpperCase()} • Normal` : 'No readings yet'}
              </p>
            </div>
          </div>

          {/* Blood Pressure status */}
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex flex-col justify-between">
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Blood Pressure</span>
            <div className="mt-1">
              <span className="font-headline font-extrabold text-lg text-on-surface">
                {latestBP ? `${latestBP.systolic}/${latestBP.diastolic} ` : '--/-- '} <span className="text-xs font-semibold text-outline">mmHg</span>
              </span>
              <p className="text-[10px] font-bold text-secondary truncate mt-0.5">
                {latestBP ? `Pulse ${latestBP.pulse || '--'} bpm` : 'No readings yet'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Consumed of Medicine & Stock Inventory Widget (With Fraction Calculation) */}
      <section aria-label="Daily Consumed & Stock" className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm border border-surface-container flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">inventory</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-sm text-on-surface">Daily Consumed & Stock Levels</h3>
              <p className="text-[11px] text-on-surface-variant font-medium">
                {formatFraction(totalPillsConsumedToday)} units taken today ({takenDoses} of {totalDoses} doses) • {medicines.filter(m => m.status === 'active').length} active courses
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const activeMed = medicines.find((m) => m.status === 'active') || medicines[0];
              if (activeMed) {
                setSelectedMedForConsumption(activeMed.id);
                setConsumedAmountToLog(activeMed.doseAmount || 1);
                setIsLogConsumedOpen(true);
              }
            }}
            type="button"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-[15px]">pie_chart</span>
            <span>+ Record Consumed</span>
          </button>
        </div>

        {/* Consumed Today pill list */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">
              Consumed Today (Fractions Counted: {formatFraction(totalPillsConsumedToday)})
            </span>
          </div>
          {consumedDosesToday.length === 0 ? (
            <p className="text-xs text-on-surface-variant italic py-1">No medicines taken yet today.</p>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {consumedDosesToday.map((dose) => (
                <div
                  key={`consumed-${dose.id}`}
                  className="px-2.5 py-1.5 rounded-xl bg-secondary-fixed/50 text-on-secondary-fixed-variant text-xs font-semibold shrink-0 flex items-center gap-1.5 border border-secondary/20"
                >
                  <span className="material-symbols-outlined text-[14px] text-secondary">check_circle</span>
                  <span>{dose.medicineName} ({formatFraction(dose.consumedAmount || dose.amount || 1)} {dose.form})</span>
                  <span className="text-[10px] text-outline font-medium">{dose.takenAt || dose.scheduledTime}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock Status per active medicine with Edit & Consumed Option */}
        <div className="pt-2 border-t border-surface-container space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Stock & Inventory (Fractions Supported)</span>
            <span className="text-[11px] text-outline font-medium">Auto-deducted on consumption</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {medicines.filter(m => m.status === 'active').slice(0, 4).map((med) => {
              const isLow = med.remainingQuantity <= med.refillTrigger;
              const perDay = roundFraction((med.scheduledTimes.length || 1) * (med.doseAmount || 1));
              const daysLeft = perDay > 0 ? Math.floor(med.remainingQuantity / perDay) : 0;
              const consumedCount = med.consumedQuantity !== undefined
                ? med.consumedQuantity
                : Math.max(0, roundFraction(med.totalQuantity - med.remainingQuantity));

              return (
                <div key={`stock-${med.id}`} className="p-3 rounded-2xl bg-surface-container-low flex flex-col justify-between gap-2 border border-surface-container">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p
                          onClick={() => onSelectMedicine(med)}
                          className="font-headline font-bold text-xs text-on-surface hover:text-primary cursor-pointer truncate"
                        >
                          {med.name}
                        </p>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant">
                          {med.strength}{med.strengthUnit}
                        </span>
                      </div>
                      <p className={`text-[11px] font-semibold mt-0.5 ${isLow ? 'text-error font-bold' : 'text-on-surface-variant'}`}>
                        {formatFraction(med.remainingQuantity)} {med.form}s left (~{daysLeft} days)
                      </p>
                      <p className="text-[10px] text-outline mt-0.5">
                        Consumed: <strong className="text-primary">{formatFraction(consumedCount)}</strong> / {med.totalQuantity} • Burn: {formatFraction(perDay)}/day
                      </p>
                    </div>
                  </div>

                  {/* Actions: Edit, Log Fraction, Refill */}
                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-surface-container-lowest">
                    {onEditMedicine && (
                      <button
                        onClick={() => onEditMedicine(med)}
                        type="button"
                        className="px-2 py-1 rounded-lg bg-surface-container text-primary text-[10px] font-bold hover:bg-surface-container-high transition-all flex items-center gap-0.5"
                        title="Edit Medicine"
                      >
                        <span className="material-symbols-outlined text-[13px]">edit</span>
                        <span>Edit</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedMedForConsumption(med.id);
                        setConsumedAmountToLog(med.doseAmount || 1);
                        setIsLogConsumedOpen(true);
                      }}
                      type="button"
                      className="px-2 py-1 rounded-lg bg-surface-container text-secondary text-[10px] font-bold hover:bg-surface-container-high transition-all flex items-center gap-0.5"
                      title="Record Consumed Amount"
                    >
                      <span className="material-symbols-outlined text-[13px]">pie_chart</span>
                      <span>Log</span>
                    </button>
                    <button
                      onClick={() => onOpenRefill(med)}
                      type="button"
                      className="px-2 py-1 rounded-lg bg-primary text-on-primary text-[10px] font-bold shrink-0 hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-0.5 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[13px]">local_pharmacy</span>
                      <span>Refill</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dose Checklist Grouped Chronologically */}
      <section aria-label="Daily Dosage Schedule" className="flex flex-col space-y-4">
        <div className="flex items-center justify-between pt-1">
          <div>
            <h3 className="font-headline font-bold text-sm text-on-surface">Daily Dosage Schedule</h3>
            <p className="text-[11px] text-on-surface-variant font-medium">
              Today's planned doses • {takenDoses} of {totalDoses} taken ({adherencePercentage}%)
            </p>
          </div>
          {onOpenExportCalendar && (
            <button
              onClick={onOpenExportCalendar}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container text-primary font-bold text-xs shadow-xs active:scale-95 transition-all border border-primary/20"
              type="button"
              title="Export dosage routine to .ics calendar"
            >
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              <span>Export .ics</span>
            </button>
          )}
        </div>

        {/* Empty Schedule Placeholder */}
        {doses.length === 0 && (
          <div className="p-8 rounded-3xl bg-surface-container-lowest border border-dashed border-outline-variant/40 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">medication</span>
            </div>
            <div className="space-y-1">
              <h4 className="font-headline font-bold text-base text-on-surface">No Doses Scheduled for Today</h4>
              <p className="text-xs text-on-surface-variant max-w-xs">
                Your schedule is clear. Add your medicines to start tracking daily doses and reminders.
              </p>
            </div>
            <button
              onClick={onOpenAddMedicine}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add Medicine</span>
            </button>
          </div>
        )}
        {morningDoses.length > 0 && (
          <div className="flex flex-col space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">wb_twilight</span>
                </div>
                <span className="font-headline font-bold text-sm text-on-surface">
                  Morning Routine
                </span>
                <span className="text-xs text-on-surface-variant">• 8:00 AM</span>
              </div>
              {allMorningTaken && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-bold">
                  <span className="material-symbols-outlined text-[14px]">done_all</span> All Taken
                </span>
              )}
            </div>

            {morningDoses.map((dose) => {
              const isTaken = dose.status === 'taken';
              return (
                <article
                  key={dose.id}
                  className={`bg-surface-container-low rounded-2xl p-3.5 flex items-center justify-between transition-all border border-surface-container ${
                    isTaken ? 'opacity-85' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      onClick={() =>
                        onUpdateDoseStatus(dose.id, isTaken ? 'pending' : 'taken')
                      }
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-transform active:scale-90 ${
                        isTaken
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-surface-container-high text-outline hover:text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isTaken ? 'check_circle' : 'circle'}
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3
                          className={`font-headline font-bold text-sm text-on-surface truncate ${
                            isTaken ? 'line-through decoration-outline/60' : ''
                          }`}
                        >
                          {dose.medicineName}
                        </h3>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                          {dose.strength}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant truncate">
                        {dose.instructions || `1 ${dose.form} • ${dose.mealTiming.replace('_', ' ')}`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onUpdateDoseStatus(dose.id, isTaken ? 'pending' : 'taken')
                    }
                    aria-label="Revert dose status"
                    className="w-9 h-9 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-lowest transition-all"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isTaken ? 'undo' : 'check'}
                    </span>
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {/* TIME BLOCK 2: AFTERNOON (DUE NOW - HIGHLIGHTED HERO CARD) */}
        {afternoonDoses.length > 0 && (
          <div className="flex flex-col space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">wb_sunny</span>
                </div>
                <span className="font-headline font-bold text-sm text-on-surface">Afternoon</span>
                <span className="text-xs text-on-surface-variant">• 1:30 PM</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-extrabold animate-pulse">
                <span className="material-symbols-outlined text-[14px]">notifications_active</span>{' '}
                Due Now
              </span>
            </div>

            {afternoonDoses.map((dose) => {
              const isTaken = dose.status === 'taken';
              const isSnoozed = snoozedDoses[dose.id];

              if (isTaken) {
                return (
                  <article
                    key={dose.id}
                    className="bg-surface-container-low rounded-2xl p-3.5 flex items-center justify-between opacity-85 transition-all border border-surface-container"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-headline font-bold text-sm text-on-surface line-through decoration-outline/60 truncate">
                            {dose.medicineName}
                          </h3>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-semibold">
                            {dose.strength}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant truncate">
                          Taken at 1:35 PM with lunch
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onUpdateDoseStatus(dose.id, 'pending')}
                      className="text-xs text-primary font-bold hover:underline"
                      type="button"
                    >
                      Undo
                    </button>
                  </article>
                );
              }

              return (
                <article
                  key={dose.id}
                  className="relative bg-surface-container-lowest rounded-2xl p-4 shadow-md transition-all duration-300 border border-primary/20"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-l-2xl" />
                  <div className="flex items-start justify-between gap-3 pl-1">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[28px]">medication</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-headline font-bold text-base text-on-surface truncate">
                            {dose.medicineName}
                          </h3>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold">
                            {dose.strength}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                          1 Capsule • Take after lunch
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                            <span className="material-symbols-outlined text-[14px]">restaurant</span>{' '}
                            With food
                          </span>
                          <span className="text-outline-variant">•</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-error">
                            <span className="material-symbols-outlined text-[14px]">repeat</span> Day 5
                            of 7
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Direct Quick Check */}
                    <button
                      onClick={() => onUpdateDoseStatus(dose.id, 'taken')}
                      aria-label={`Mark ${dose.medicineName} as taken`}
                      className="w-11 h-11 rounded-full bg-surface-container-low text-primary hover:bg-primary hover:text-on-primary flex items-center justify-center shrink-0 shadow-sm active:scale-90 transition-all border border-primary/10"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[26px]">check</span>
                    </button>
                  </div>

                  {/* Action Row */}
                  <div className="grid grid-cols-12 gap-2 mt-3.5 pt-2 border-t border-surface-container-low pl-1">
                    <button
                      onClick={() => onUpdateDoseStatus(dose.id, 'taken', dose.amount || 1)}
                      className="col-span-6 h-11 rounded-xl bg-primary text-on-primary font-headline font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95 active:scale-98 transition-all"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">done</span>
                      <span>Take {formatFraction(dose.amount || 1)} {dose.form}</span>
                    </button>
                    <button
                      onClick={() => {
                        setSnoozedDoses((prev) => ({ ...prev, [dose.id]: true }));
                        setSnoozeNotice(`Reminder for ${dose.medicineName} snoozed for 30 minutes.`);
                        setTimeout(() => setSnoozeNotice(''), 3500);
                      }}
                      className="col-span-3 h-11 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold flex items-center justify-center gap-1 hover:bg-surface-container active:scale-95 transition-all"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">snooze</span>
                      <span>{isSnoozed ? 'In 30m' : '30m'}</span>
                    </button>
                    <button
                      onClick={() => onUpdateDoseStatus(dose.id, 'skipped')}
                      className="col-span-3 h-11 rounded-xl bg-surface-container-low text-on-surface-variant text-xs font-semibold flex items-center justify-center gap-1 hover:bg-error-container hover:text-on-error-container active:scale-95 transition-all"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                      <span>Skip</span>
                    </button>
                  </div>

                  {/* Fraction Consumption Quick Picks */}
                  <div className="mt-2.5 pt-2 border-t border-surface-container-low flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <span className="text-[10px] text-outline font-bold uppercase shrink-0">Took Fraction:</span>
                    {[0.25, 0.5, 0.75, 1.0, 1.5].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => onUpdateDoseStatus(dose.id, 'taken', amt)}
                        className="px-2 py-1 rounded-lg bg-surface-container text-on-surface text-[11px] font-bold hover:bg-primary hover:text-on-primary transition-all shrink-0 active:scale-95"
                      >
                        Took {formatFraction(amt)}
                      </button>
                    ))}
                  </div>

                  {/* Test Notification Action */}
                  {onTestNotification && (
                    <div className="mt-2.5 pt-2 border-t border-dashed border-surface-container flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1 text-outline">
                        <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
                        Auto-alerts at {dose.scheduledTime}
                      </span>
                      <button
                        type="button"
                        onClick={() => onTestNotification(dose)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed/50 hover:bg-secondary-fixed text-on-secondary-fixed-variant font-bold transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[14px]">notifications_active</span>
                        Trigger Web Notification
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* TIME BLOCK 3: EVENING (UPCOMING) */}
        {eveningDoses.length > 0 && (
          <div className="flex flex-col space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">nights_stay</span>
                </div>
                <span className="font-headline font-bold text-sm text-on-surface">Evening</span>
                <span className="text-xs text-on-surface-variant">• 7:00 PM</span>
              </div>
              <span className="text-xs text-on-surface-variant font-medium">Scheduled</span>
            </div>

            {eveningDoses.map((dose) => {
              const isTaken = dose.status === 'taken';
              return (
                <article
                  key={dose.id}
                  className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm flex items-center justify-between transition-all border border-surface-container"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">vaccines</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3
                          className={`font-headline font-bold text-sm text-on-surface truncate ${
                            isTaken ? 'line-through decoration-outline/60' : ''
                          }`}
                        >
                          {dose.medicineName}
                        </h3>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                          {dose.strength}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant truncate">
                        {isTaken ? 'Taken early with dinner' : '1 Tablet • Take with dinner'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onUpdateDoseStatus(dose.id, isTaken ? 'pending' : 'taken')
                    }
                    aria-label={`Mark ${dose.medicineName}`}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-all ${
                      isTaken
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isTaken ? 'check_circle' : 'check'}
                    </span>
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {/* TIME BLOCK 4: NIGHT & BEDTIME (UPCOMING) */}
        {nightDoses.length > 0 && (
          <div className="flex flex-col space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">bedtime</span>
                </div>
                <span className="font-headline font-bold text-sm text-on-surface">
                  Night & Bedtime
                </span>
                <span className="text-xs text-on-surface-variant">• 10:00 PM</span>
              </div>
              <span className="text-xs text-on-surface-variant font-medium">Scheduled</span>
            </div>

            {nightDoses.map((dose) => {
              const isTaken = dose.status === 'taken';
              return (
                <article
                  key={dose.id}
                  className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm flex items-center justify-between transition-all border border-surface-container"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">dark_mode</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3
                          className={`font-headline font-bold text-sm text-on-surface truncate ${
                            isTaken ? 'line-through decoration-outline/60' : ''
                          }`}
                        >
                          {dose.medicineName}
                        </h3>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant">
                          {dose.strength}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant truncate">
                        {isTaken ? 'Taken early for sleep' : '1 Tablet • 30 mins before sleep'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      onUpdateDoseStatus(dose.id, isTaken ? 'pending' : 'taken')
                    }
                    aria-label={`Mark ${dose.medicineName}`}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-all ${
                      isTaken
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isTaken ? 'check_circle' : 'check'}
                    </span>
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Safety Reassurance Note */}
      <div className="p-3.5 rounded-2xl bg-surface-container-low flex items-center gap-2.5 text-on-surface-variant border border-surface-container">
        <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
          verified_user
        </span>
        <p className="text-xs leading-relaxed">
          All drug-drug interactions verified with current pharmacy records. Next interaction sync
          scheduled for 11:00 PM.
        </p>
      </div>

      {/* Snooze Notice Toast */}
      {snoozeNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-inverse-surface text-inverse-on-surface shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[16px] text-primary">snooze</span>
          <span>{snoozeNotice}</span>
        </div>
      )}

      {/* HOW MUCH CONSUMED QUICK LOGGER MODAL */}
      {isLogConsumedOpen && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLogConsumedOpen(false);
          }}
        >
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-surface-container flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 bg-surface-container-low flex items-center justify-between border-b border-surface-container">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">pie_chart</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-on-surface">
                    Record Medicine Consumed
                  </h3>
                  <p className="text-xs text-on-surface-variant font-medium">
                    Supports fractions (½, ¼, 1 ½) • Stock auto-calculates
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsLogConsumedOpen(false);
                  setConsumptionSuccessMsg('');
                }}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4">
              {consumptionSuccessMsg && (
                <div className="p-3 rounded-xl bg-secondary-fixed text-on-secondary-fixed-variant text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>{consumptionSuccessMsg}</span>
                </div>
              )}

              {/* Medicine Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                  Select Medication
                </label>
                <select
                  value={selectedMedForConsumption}
                  onChange={(e) => {
                    setSelectedMedForConsumption(e.target.value);
                    const chosen = medicines.find((m) => m.id === e.target.value);
                    if (chosen) setConsumedAmountToLog(chosen.doseAmount || 1);
                  }}
                  className="w-full text-xs font-bold text-on-surface bg-surface-container-low rounded-xl px-3.5 py-2.5 focus:outline-none cursor-pointer"
                >
                  {medicines
                    .filter((m) => m.status === 'active')
                    .map((med) => (
                      <option key={med.id} value={med.id}>
                        {med.name} ({med.strength}{med.strengthUnit}) • {formatFraction(med.remainingQuantity)} {med.form}s in stock
                      </option>
                    ))}
                </select>
              </div>

              {/* Selected Med Reference */}
              {(() => {
                const targetMed =
                  medicines.find((m) => m.id === selectedMedForConsumption) ||
                  medicines.find((m) => m.status === 'active') ||
                  medicines[0];
                if (!targetMed) return null;

                const curRemaining = targetMed.remainingQuantity;
                const curConsumed =
                  targetMed.consumedQuantity !== undefined
                    ? targetMed.consumedQuantity
                    : Math.max(0, roundFraction(targetMed.totalQuantity - targetMed.remainingQuantity));
                const newRemaining = Math.max(0, roundFraction(curRemaining - consumedAmountToLog));
                const newTotalConsumed = roundFraction(curConsumed + consumedAmountToLog);

                return (
                  <div className="space-y-4">
                    {/* Amount to Consume (Fraction Presets) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                          Amount Consumed (Fractions Supported)
                        </label>
                        <span className="text-xs font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                          {formatFraction(consumedAmountToLog)} {targetMed.form}
                          {consumedAmountToLog > 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Presets */}
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {COMMON_FRACTION_DOSES.map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => setConsumedAmountToLog(preset.value)}
                            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center ${
                              Math.abs(consumedAmountToLog - preset.value) < 0.01
                                ? 'bg-primary text-on-primary shadow-sm'
                                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                            }`}
                          >
                            <span className="block font-headline text-sm">
                              {preset.label.split(' ')[0]}
                            </span>
                            <span className="text-[9px] opacity-80 block">{preset.badge}</span>
                          </button>
                        ))}
                      </div>

                      {/* Custom Stepper */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low mt-1.5">
                        <span className="text-xs font-semibold text-on-surface">Custom Amount:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setConsumedAmountToLog(Math.max(0.25, roundFraction(consumedAmountToLog - 0.25)))
                            }
                            className="w-8 h-8 rounded-lg bg-surface-container text-primary font-bold text-base hover:bg-surface-container-high flex items-center justify-center"
                          >
                            -
                          </button>
                          <div className="flex items-baseline gap-1">
                            <input
                              type="number"
                              step="0.25"
                              min="0.1"
                              max={curRemaining}
                              value={consumedAmountToLog}
                              onChange={(e) =>
                                setConsumedAmountToLog(Math.max(0.1, parseFloat(e.target.value) || 0.5))
                              }
                              className="w-14 font-headline text-lg font-bold text-center bg-transparent text-on-surface focus:outline-none"
                            />
                            <span className="text-xs text-outline font-medium">{targetMed.form}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setConsumedAmountToLog(
                                Math.min(curRemaining, roundFraction(consumedAmountToLog + 0.25))
                              )
                            }
                            className="w-8 h-8 rounded-lg bg-surface-container text-primary font-bold text-base hover:bg-surface-container-high flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Live Calculation Preview Banner */}
                    <div className="rounded-2xl bg-secondary-fixed/30 p-3.5 border border-secondary/20 space-y-2">
                      <span className="text-[11px] font-bold text-on-secondary-fixed-variant uppercase tracking-wider block">
                        Live Fraction Stock Calculation
                      </span>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-surface-container-lowest shadow-sm">
                          <span className="text-[10px] uppercase font-bold text-outline block">
                            Current Stock
                          </span>
                          <span className="font-headline font-bold text-sm text-on-surface">
                            {formatFraction(curRemaining)}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
                          <span className="text-[10px] uppercase font-bold text-primary block">
                            Consuming
                          </span>
                          <span className="font-headline font-bold text-sm text-primary">
                            - {formatFraction(consumedAmountToLog)}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-surface-container-lowest shadow-sm">
                          <span className="text-[10px] uppercase font-bold text-secondary block">
                            New Stock
                          </span>
                          <span className="font-headline font-bold text-sm text-secondary">
                            {formatFraction(newRemaining)}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-on-surface-variant flex justify-between pt-1 border-t border-secondary/20">
                        <span>Total Consumed to Date:</span>
                        <span className="font-bold">
                          {formatFraction(newTotalConsumed)} / {targetMed.totalQuantity} {targetMed.form}s
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogConsumedOpen(false);
                          setConsumptionSuccessMsg('');
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateConsumed) {
                            onUpdateConsumed(targetMed.id, newTotalConsumed);
                          }
                          setConsumptionSuccessMsg(
                            `Successfully recorded ${formatFraction(consumedAmountToLog)} ${targetMed.form}s consumed!`
                          );
                          setTimeout(() => {
                            setIsLogConsumedOpen(false);
                            setConsumptionSuccessMsg('');
                          }, 1200);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        <span>Confirm & Update Stock</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Floating Dual Action Log & Scan Button */}
      <div className="sticky bottom-20 z-40 self-center max-w-sm w-full pt-1">
        <div className="mx-auto flex items-center justify-between gap-2 p-1.5 rounded-full bg-surface-container-lowest/95 backdrop-blur-xl shadow-xl ring-1 ring-black/5 border border-primary/20">
          <button
            onClick={onOpenAddMedicine}
            className="flex-1 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center gap-2 px-4 font-headline font-bold text-xs shadow-sm hover:opacity-90 active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>Log Medicine</span>
          </button>
          <button
            onClick={onOpenScanner}
            aria-label="Scan Prescription Label"
            className="h-12 w-12 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center shrink-0 hover:bg-surface-container-highest active:scale-95 transition-all"
            type="button"
            title="Scan Prescription Label"
          >
            <span className="material-symbols-outlined text-[22px]">document_scanner</span>
          </button>
        </div>
      </div>
    </div>
  );
};
