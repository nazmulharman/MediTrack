import React, { useState } from 'react';
import { Medicine } from '../types/medicine';
import { formatFraction, roundFraction, COMMON_FRACTION_DOSES } from '../utils/fractionUtils';

interface MedicineDetailModalProps {
  medicine: Medicine | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRefill: (med: Medicine) => void;
  onEditMedicine?: (med: Medicine) => void;
  onUpdateConsumed?: (medId: string, newConsumed: number) => void;
  onToggleStatus: (medId: string, newStatus: 'active' | 'completed' | 'discontinued') => void;
  onInspectPrescription?: (rxId: string) => void;
  onExportCalendar?: (medicineId?: string) => void;
  onContactDoctor?: (med: Medicine) => void;
  onRequestRenewal?: (med: Medicine) => void;
}

export const MedicineDetailModal: React.FC<MedicineDetailModalProps> = ({
  medicine,
  isOpen,
  onClose,
  onOpenRefill,
  onEditMedicine,
  onUpdateConsumed,
  onToggleStatus,
  onInspectPrescription,
  onExportCalendar,
  onContactDoctor,
  onRequestRenewal,
}) => {
  if (!isOpen || !medicine) return null;

  const [isAdjustingConsumed, setIsAdjustingConsumed] = useState(false);
  const currentConsumed = medicine.consumedQuantity !== undefined
    ? medicine.consumedQuantity
    : Math.max(0, roundFraction(medicine.totalQuantity - medicine.remainingQuantity));
  const [consumedInput, setConsumedInput] = useState<number>(currentConsumed);

  const isLowStock = medicine.remainingQuantity <= medicine.refillTrigger;
  const dosesPerDay = medicine.scheduledTimes.length || 1;
  const dosePerIntake = medicine.doseAmount || 1;
  const dailyBurnRate = roundFraction(dosesPerDay * dosePerIntake);
  const daysSupplyLeft = dailyBurnRate > 0
    ? roundFraction(medicine.remainingQuantity / dailyBurnRate, 1)
    : 0;

  const handleSaveConsumedAdjustment = (newVal: number) => {
    const validVal = Math.max(0, Math.min(medicine.totalQuantity, roundFraction(newVal)));
    setConsumedInput(validVal);
    if (onUpdateConsumed) {
      onUpdateConsumed(medicine.id, validVal);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-surface-container">
        {/* Header */}
        <div className="p-4 bg-surface-container-low flex items-center justify-between border-b border-surface-container">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[24px]">medication</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-headline font-bold text-lg text-on-surface truncate">
                  {medicine.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold">
                  {medicine.strength}
                  {medicine.strengthUnit}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant truncate font-medium">
                {medicine.condition || `${medicine.form} • ${medicine.frequency}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onEditMedicine && (
              <button
                onClick={() => {
                  onClose();
                  onEditMedicine(medicine);
                }}
                className="px-2.5 py-1.5 rounded-full bg-surface-container text-primary text-xs font-bold hover:bg-surface-container-high transition-colors flex items-center gap-1"
                type="button"
                title="Edit Medication"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Edit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable details */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Status & Inventory Banner */}
          <div className="grid grid-cols-2 gap-3">
            {/* Inventory Card */}
            <div
              className={`p-3.5 rounded-2xl flex flex-col justify-between ${
                isLowStock
                  ? 'bg-error-container/30 border border-error/20'
                  : 'bg-surface-container-low'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Remaining Stock
                </span>
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    isLowStock ? 'text-error' : 'text-primary'
                  }`}
                >
                  inventory_2
                </span>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1">
                  <span className="font-headline text-2xl font-extrabold text-on-surface">
                    {formatFraction(medicine.remainingQuantity)}
                  </span>
                  <span className="text-xs text-outline font-medium">/ {medicine.totalQuantity}</span>
                </div>
                <p className="text-[11px] font-semibold text-on-surface-variant mt-0.5">
                  ~{daysSupplyLeft} days remaining
                </p>
              </div>
              <button
                onClick={() => onOpenRefill(medicine)}
                type="button"
                className="mt-3 w-full py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">local_pharmacy</span>
                Restock
              </button>
            </div>

            {/* Adherence Rate */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Adherence
                </span>
                <span className="material-symbols-outlined text-[18px] text-secondary">
                  trending_up
                </span>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-0.5">
                  <span className="font-headline text-2xl font-extrabold text-primary">
                    {medicine.adherenceRate}%
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-0.5 font-medium">
                  30-day compliance
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <div
                    key={day}
                    className="flex-1 h-2 rounded-full bg-secondary-container"
                    title={`Day ${day}: Taken`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* HOW MUCH CONSUMED & FRACTION CALCULATION SECTION */}
          <div className="rounded-2xl bg-surface-container-low p-3.5 space-y-3 border border-surface-container">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">data_usage</span>
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  How Much Consumed (Fraction Calculation)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustingConsumed(!isAdjustingConsumed)}
                className="text-xs font-bold text-primary hover:underline"
              >
                {isAdjustingConsumed ? 'Done' : 'Adjust Consumed'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-surface-container-lowest shadow-sm">
                <span className="text-[10px] uppercase font-bold text-outline block">Total Pack</span>
                <span className="font-headline font-bold text-base text-on-surface">
                  {medicine.totalQuantity}
                </span>
                <span className="text-[10px] text-outline block">{medicine.form}s</span>
              </div>
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-primary block">Consumed</span>
                <span className="font-headline font-extrabold text-base text-primary">
                  {formatFraction(currentConsumed)}
                </span>
                <span className="text-[10px] text-primary/80 block">({currentConsumed} {medicine.form}s)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-lowest shadow-sm">
                <span className="text-[10px] uppercase font-bold text-outline block">Remaining</span>
                <span className="font-headline font-bold text-base text-secondary">
                  {formatFraction(medicine.remainingQuantity)}
                </span>
                <span className="text-[10px] text-outline block">{medicine.form}s</span>
              </div>
            </div>

            {/* Quick Consumed Adjuster */}
            {isAdjustingConsumed && (
              <div className="p-3 rounded-xl bg-surface-container-lowest space-y-2.5 border border-primary/30">
                <span className="text-xs font-semibold text-on-surface block">
                  Update Consumed Amount (Takes fractions like ½, ¼, 1.5):
                </span>

                {/* Quick Fraction Presets */}
                <div className="grid grid-cols-6 gap-1">
                  {COMMON_FRACTION_DOSES.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleSaveConsumedAdjustment(preset.value)}
                      className="py-1.5 px-1 rounded-lg bg-surface-container text-xs font-bold text-on-surface hover:bg-primary hover:text-on-primary transition-all text-center"
                      title={`Set consumed to ${preset.label}`}
                    >
                      <span className="block text-xs">{preset.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleSaveConsumedAdjustment(currentConsumed - 0.25)}
                    className="px-2 py-1 rounded-lg bg-surface-container font-bold text-xs hover:bg-surface-container-high"
                    title="Subtract 1/4"
                  >
                    - ¼
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveConsumedAdjustment(currentConsumed - 0.5)}
                    className="px-2 py-1 rounded-lg bg-surface-container font-bold text-xs hover:bg-surface-container-high"
                    title="Subtract 1/2"
                  >
                    - ½
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveConsumedAdjustment(currentConsumed - 1)}
                    className="px-2 py-1 rounded-lg bg-surface-container font-bold text-xs hover:bg-surface-container-high"
                    title="Subtract 1"
                  >
                    - 1
                  </button>
                  <div className="flex-1 flex items-center justify-center gap-1 min-w-[100px]">
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max={medicine.totalQuantity}
                      value={consumedInput}
                      onChange={(e) => setConsumedInput(parseFloat(e.target.value) || 0)}
                      className="w-16 text-center font-headline font-bold text-base text-primary bg-surface-container-low rounded-lg py-1 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveConsumedAdjustment(consumedInput)}
                      className="px-2.5 py-1 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-sm"
                    >
                      Set
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveConsumedAdjustment(currentConsumed + 0.25)}
                    className="px-2 py-1 rounded-lg bg-surface-container text-primary font-bold text-xs hover:bg-surface-container-high"
                    title="Add 1/4"
                  >
                    + ¼
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveConsumedAdjustment(currentConsumed + 0.5)}
                    className="px-2 py-1 rounded-lg bg-surface-container text-primary font-bold text-xs hover:bg-surface-container-high"
                    title="Add 1/2"
                  >
                    + ½
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveConsumedAdjustment(currentConsumed + 1)}
                    className="px-2 py-1 rounded-lg bg-surface-container text-primary font-bold text-xs hover:bg-surface-container-high"
                    title="Add 1"
                  >
                    + 1
                  </button>
                </div>
              </div>
            )}

            <div className="text-[11px] text-on-surface-variant flex items-center justify-between pt-1">
              <span>Intake per dose: <strong>{formatFraction(dosePerIntake)} {medicine.form}</strong></span>
              <span>Daily burn: <strong>{formatFraction(dailyBurnRate)} {medicine.form}s/day</strong></span>
            </div>
          </div>

          {/* Daily Schedule */}
          <div className="rounded-2xl bg-surface-container-low p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                Daily Dosage Schedule
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-primary">{medicine.frequency}</span>
                {onExportCalendar && (
                  <button
                    type="button"
                    onClick={() => {
                      onExportCalendar(medicine.id);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-[11px] hover:bg-primary/20 active:scale-95 transition-all"
                    title="Export this medication schedule to .ics calendar"
                  >
                    <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                    <span>Export .ics</span>
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
              {medicine.scheduledTimes.map((time, idx) => (
                <div
                  key={idx}
                  className="flex-1 min-w-[70px] p-2 rounded-xl bg-surface-container-lowest text-center shadow-sm"
                >
                  <span className="font-headline font-bold text-sm text-primary block">{time}</span>
                  <span className="text-[10px] text-outline uppercase font-semibold">
                    {formatFraction(dosePerIntake)} {medicine.form}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-on-surface-variant italic pt-1">
              Instructions: {medicine.instructions || `Take with water ${medicine.mealTiming.replace('_', ' ')}.`}
            </p>
          </div>

          {/* Course Progress (if fixed duration) */}
          {medicine.isFixedDuration && (
            <div className="rounded-2xl bg-surface-container-low p-3.5 space-y-2.5 border border-primary/20">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-error">timer</span>
                  Course Duration & Stop Date
                </span>
                <span className="font-bold text-primary">
                  Day {medicine.currentDay || 5} of {medicine.durationDays || 7}
                </span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(((medicine.currentDay || 5) / (medicine.durationDays || 7)) * 100)
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-outline">
                <span>Start: {medicine.startDate}</span>
                <span>Stop Date: <strong className="text-error">{medicine.endDate || 'Oct 28, 2024'}</strong></span>
              </div>

              {/* Stop Reminder Alert Badge */}
              <div className="p-2.5 rounded-xl bg-error-container/40 text-on-error-container flex items-start gap-2 text-xs">
                <span className="material-symbols-outlined text-[18px] text-error shrink-0 mt-0.5">
                  notification_important
                </span>
                <div>
                  <span className="font-bold block">Course Completion & Stop Protection</span>
                  <span className="text-[11px]">
                    Automatic desktop alerts remind you before the {medicine.durationDays || 7}-day course finishes on {medicine.endDate || 'Oct 28, 2024'} to consult your doctor or renew.
                  </span>
                </div>
              </div>

              {/* Action Buttons: Contact Doctor & Request Renewal */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {onContactDoctor && (
                  <button
                    type="button"
                    onClick={() => onContactDoctor(medicine)}
                    className="py-2.5 px-3 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">call</span>
                    <span>Contact Doctor</span>
                  </button>
                )}

                {onRequestRenewal && (
                  <button
                    type="button"
                    onClick={() => onRequestRenewal(medicine)}
                    className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">autorenew</span>
                    <span>Request Renewal</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Linked Doctor & Prescription */}
          <div className="rounded-2xl bg-surface-container-low p-3.5 space-y-2">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
              Prescribing Provider
            </span>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-on-surface">
                  {medicine.doctorName || 'Dr. Marcus Vance, MD'}
                </p>
                <p className="text-[11px] text-on-surface-variant">Associated Medical Prescription</p>
              </div>
              {(medicine.prescriptionId || medicine.photoUrl) && onInspectPrescription && (
                <button
                  onClick={() => onInspectPrescription(medicine.prescriptionId || 'custom')}
                  type="button"
                  className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-xs font-bold flex items-center gap-1 hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                  View Rx
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3.5 bg-surface-container-low border-t border-surface-container flex items-center gap-2">
          {onEditMedicine && (
            <button
              onClick={() => {
                onClose();
                onEditMedicine(medicine);
              }}
              type="button"
              className="flex-1 py-2.5 rounded-full bg-primary text-on-primary font-semibold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit Details
            </button>
          )}

          {medicine.status === 'active' ? (
            <button
              onClick={() => {
                onToggleStatus(medicine.id, 'completed');
                onClose();
              }}
              type="button"
              className="flex-1 py-2.5 rounded-full bg-surface-container-high text-on-surface font-semibold text-xs hover:bg-surface-container-highest transition-all flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Mark Completed
            </button>
          ) : (
            <button
              onClick={() => {
                onToggleStatus(medicine.id, 'active');
                onClose();
              }}
              type="button"
              className="flex-1 py-2.5 rounded-full bg-secondary text-on-secondary font-semibold text-xs shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">replay</span>
              Reactivate
            </button>
          )}

          <button
            onClick={() => {
              onToggleStatus(medicine.id, 'discontinued');
              onClose();
            }}
            type="button"
            className="px-3.5 py-2.5 rounded-full bg-error-container/50 text-error font-semibold text-xs hover:bg-error-container transition-all flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">stop_circle</span>
            Stop
          </button>
        </div>
      </div>
    </div>
  );
};
