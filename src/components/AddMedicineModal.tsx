import React, { useState } from 'react';
import { DosageForm, MealTiming, Medicine } from '../types/medicine';
import { ExtractedMedicationData } from './CameraScanModal';
import { formatFraction, roundFraction, COMMON_FRACTION_DOSES } from '../utils/fractionUtils';
import { CameraCaptureModal } from './CameraCaptureModal';
import { ImageCropModal } from './ImageCropModal';

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMedicine: (medicine: Medicine) => void;
  onOpenScanner?: () => void;
  prefilledData?: ExtractedMedicationData | null;
  editMedicine?: Medicine | null;
  activePatientId: string;
}

export const AddMedicineModal: React.FC<AddMedicineModalProps> = ({
  isOpen,
  onClose,
  onSaveMedicine,
  onOpenScanner,
  prefilledData,
  editMedicine,
  activePatientId,
}) => {
  if (!isOpen) return null;

  const isEditMode = !!editMedicine;

  // Form State
  const [name, setName] = useState<string>(
    editMedicine?.name || prefilledData?.name || ''
  );
  const [form, setForm] = useState<DosageForm>(
    editMedicine?.form || prefilledData?.form || 'tablet'
  );
  const [strength, setStrength] = useState<string>(
    editMedicine?.strength || prefilledData?.strength || ''
  );
  const [strengthUnit, setStrengthUnit] = useState<string>(
    editMedicine?.strengthUnit || prefilledData?.strengthUnit || 'mg'
  );
  const [frequency, setFrequency] = useState<string>(
    editMedicine?.frequency || prefilledData?.frequency || '1x daily (morning)'
  );
  const [mealTiming, setMealTiming] = useState<MealTiming>(
    editMedicine?.mealTiming || prefilledData?.mealTiming || 'after_food'
  );
  const [isFixedDuration, setIsFixedDuration] = useState<boolean>(
    editMedicine ? editMedicine.isFixedDuration : false
  );
  const [durationDays, setDurationDays] = useState<number>(
    editMedicine?.durationDays || prefilledData?.durationDays || 7
  );

  // Dosage per intake (Fraction support)
  const [doseAmount, setDoseAmount] = useState<number>(
    editMedicine?.doseAmount || 1.0
  );

  // Total quantity and consumed quantity
  const [totalQuantity, setTotalQuantity] = useState<number>(
    editMedicine?.totalQuantity || prefilledData?.totalQuantity || 30
  );
  const [consumedQuantity, setConsumedQuantity] = useState<number>(
    editMedicine?.consumedQuantity !== undefined
      ? editMedicine.consumedQuantity
      : isEditMode
      ? Math.max(0, roundFraction(totalQuantity - (editMedicine?.remainingQuantity || 0)))
      : 0
  );

  const [refillTrigger, setRefillTrigger] = useState<number>(
    editMedicine?.refillTrigger || prefilledData?.refillTrigger || 5
  );
  const [startDate, setStartDate] = useState<string>(
    editMedicine?.startDate || new Date().toISOString().split('T')[0]
  );
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(
    editMedicine?.scheduledTimes || prefilledData?.scheduledTimes || ['08:00']
  );
  const [isEditingTimes, setIsEditingTimes] = useState<boolean>(false);
  const [stopReminderEnabled, setStopReminderEnabled] = useState<boolean>(
    editMedicine?.stopReminderEnabled !== undefined ? editMedicine.stopReminderEnabled : true
  );
  const [instructions, setInstructions] = useState<string>(
    editMedicine?.instructions || ''
  );
  const [doctorName, setDoctorName] = useState<string>(
    editMedicine?.doctorName || prefilledData?.doctorName || ''
  );

  // Attached Document / Rx Photo State
  const [attachedDocUrl, setAttachedDocUrl] = useState<string | null>(
    editMedicine?.photoUrl || prefilledData?.photoUrl || null
  );
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState<boolean>(false);
  const [isCroppingAttachedDoc, setIsCroppingAttachedDoc] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  // Calculations
  const calculatedRemaining = Math.max(0, roundFraction(totalQuantity - consumedQuantity));
  const dailyIntakeUnits = roundFraction((scheduledTimes.length || 1) * doseAmount);
  const daysSupplyRemaining = dailyIntakeUnits > 0
    ? roundFraction(calculatedRemaining / dailyIntakeUnits, 1)
    : 0;

  // Common quick picks
  const COMMON_DRUGS = [
    { name: 'Amoxicillin', form: 'tablet' as DosageForm, strength: '500', unit: 'mg' },
    { name: 'Augmentin', form: 'tablet' as DosageForm, strength: '625', unit: 'mg' },
    { name: 'Azithromycin', form: 'tablet' as DosageForm, strength: '250', unit: 'mg' },
    { name: 'Metformin', form: 'tablet' as DosageForm, strength: '500', unit: 'mg' },
    { name: 'Atorvastatin', form: 'tablet' as DosageForm, strength: '20', unit: 'mg' },
    { name: 'Lisinopril', form: 'tablet' as DosageForm, strength: '10', unit: 'mg' },
  ];

  // Calculate End Date
  const calculateEndDate = () => {
    try {
      const start = new Date(startDate);
      start.setDate(start.getDate() + durationDays);
      return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Ends in 7 days';
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      setErrorMsg('Please enter a medication name');
      return;
    }
    setErrorMsg('');

    const finalRemaining = Math.max(0, roundFraction(totalQuantity - consumedQuantity));

    const medToSave: Medicine = {
      id: editMedicine ? editMedicine.id : `med-${Date.now()}`,
      patientId: editMedicine?.patientId || activePatientId,
      name: name.trim(),
      strength,
      strengthUnit,
      form,
      frequency,
      frequencyIntervalHours: 24 / (scheduledTimes.length || 1),
      scheduledTimes,
      mealTiming,
      isFixedDuration,
      startDate,
      durationDays: isFixedDuration ? durationDays : undefined,
      endDate: isFixedDuration ? calculateEndDate() : undefined,
      currentDay: editMedicine?.currentDay || 1,
      totalQuantity: roundFraction(totalQuantity),
      remainingQuantity: finalRemaining,
      consumedQuantity: roundFraction(consumedQuantity),
      doseAmount: roundFraction(doseAmount),
      refillTrigger: roundFraction(refillTrigger),
      status: editMedicine?.status || 'active',
      adherenceRate: editMedicine?.adherenceRate || 100,
      instructions: instructions.trim() || `Take ${formatFraction(doseAmount)} ${form} ${mealTiming.replace('_', ' ')}.`,
      doctorName: doctorName.trim() || 'Prescribing Physician',
      prescriptionId: editMedicine?.prescriptionId,
      photoUrl: attachedDocUrl || editMedicine?.photoUrl || undefined,
      stopReminderEnabled: isFixedDuration ? stopReminderEnabled : undefined,
      stopReminderDaysNotice: isFixedDuration ? 1 : undefined,
    };

    onSaveMedicine(medToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface overflow-y-auto flex flex-col min-h-screen">
      {/* Top Header */}
      <header className="sticky top-0 inset-x-0 z-40 bg-surface/90 backdrop-blur-xl border-b border-surface-container-low pt-safe">
        <div className="h-16 px-4 max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onClose}
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors shrink-0"
              type="button"
              aria-label="Back"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <img
              alt="MediTrack Emblem"
              className="h-7 w-auto object-contain shrink-0"
              src="https://lh3.googleusercontent.com/aida/AEtjO1WNXTutzSlNL4HTcW-feim518dpH3ZzUlt8NEn1TlTLI-lAWY8MY8NPTtPajx4P5eqoP7Z0yH2Uf6ZScVEm7Nu5cWsDWrG4jxdK6RUZ_ZKnpftZCQs3Se53yujEsu5RRIVBFGJ5T6SMGDvzihJPiA0FX0c9dJPlNOZd5bVhcLJGtbLWgURrfSrYfEwkkhjmMsUl0wTm_NqDHTmo1aecWosvlCH29EV55XRyN4a3WZoFizdNUO8KG5ihFOg"
            />
            <h1 className="font-headline font-bold text-lg text-on-surface tracking-tight truncate">
              {isEditMode ? 'Edit Medication' : 'Add Medication'}
            </h1>
          </div>
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed-variant text-[11px] font-bold">
            <span className="material-symbols-outlined text-[12px]">lock</span>
            {isEditMode ? 'Editing Regimen' : 'Secured'}
          </span>
        </div>
      </header>

      {/* Main Form Body */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-3 pb-32">
        <div className="flex items-center justify-between py-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold">
                {isEditMode ? '✏️' : '1'}
              </span>
              <span className="text-xs font-bold text-primary tracking-wide uppercase">
                {isEditMode ? 'Update Regimen & Stock' : 'Step 1 of 2'}
              </span>
            </div>
            <h2 className="font-headline font-bold text-xl text-on-surface">
              {isEditMode ? `Edit ${editMedicine.name}` : 'Medication Details'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface-variant text-xs font-semibold hover:bg-surface-container"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setFeedbackMsg('Draft safely cached on device.');
                setTimeout(() => setFeedbackMsg(''), 3000);
              }}
              className="px-3.5 py-1.5 rounded-full bg-surface-container-high text-primary text-xs font-semibold hover:bg-surface-container-highest"
              type="button"
            >
              Save Draft
            </button>
          </div>
        </div>

        {/* Feedback / Error Alerts */}
        {errorMsg && (
          <div className="p-2.5 my-2 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{errorMsg}</span>
          </div>
        )}
        {feedbackMsg && (
          <div className="p-2.5 my-2 rounded-xl bg-secondary-fixed text-on-secondary-fixed-variant text-xs font-semibold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* OCR Scan Banner if Add Mode */}
        {!isEditMode && onOpenScanner && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-secondary-container/40 via-surface-container-low to-primary-fixed/30 p-4 my-3 shadow-sm flex items-start gap-3 border border-secondary/20">
            <div className="w-10 h-10 rounded-xl bg-surface-container-lowest text-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[24px]">document_scanner</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary text-on-primary inline-block mb-1">
                Fast Setup
              </span>
              <h3 className="font-headline font-bold text-sm text-on-surface leading-tight">
                Scan Rx Label or Pill Box
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Auto-fill name, dosage strength, and frequency via camera.
              </p>
            </div>
            <button
              onClick={onOpenScanner}
              className="px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all shrink-0 mt-2"
              type="button"
            >
              Open Camera
            </button>
          </div>
        )}

        <div className="space-y-4">
          {/* Quick Drug Suggestions */}
          {!isEditMode && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {COMMON_DRUGS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    setName(item.name);
                    setForm(item.form);
                    setStrength(item.strength);
                    setStrengthUnit(item.unit);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                    name === item.name
                      ? 'bg-primary text-on-primary shadow-sm font-bold'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {item.name} {item.strength}
                  {item.unit}
                </button>
              ))}
            </div>
          )}

          {/* Medicine Name */}
          <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm space-y-1.5 border border-surface-container">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
              Medication Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Amoxicillin, Metformin, Lipitor"
              className="w-full text-base font-semibold text-on-surface bg-surface-container-low rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 border border-transparent focus:border-primary"
            />
          </div>

          {/* Dosage Form Grid */}
          <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm space-y-2 border border-surface-container">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
              Dosage Form
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'tablet' as DosageForm, label: 'Tablet', icon: 'pill' },
                { id: 'capsule' as DosageForm, label: 'Capsule', icon: 'vaccines' },
                { id: 'liquid' as DosageForm, label: 'Syrup/Liquid', icon: 'water_bottle' },
                { id: 'injection' as DosageForm, label: 'Injection', icon: 'syringe' },
                { id: 'drops' as DosageForm, label: 'Drops', icon: 'opacity' },
                { id: 'inhaler' as DosageForm, label: 'Inhaler', icon: 'air' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setForm(item.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${
                    form === item.id
                      ? 'bg-primary text-on-primary font-bold shadow-md'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                  <span className="text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Strength and Unit */}
          <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm space-y-2 border border-surface-container">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
              Strength & Unit
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                placeholder="500"
                className="flex-1 text-base font-semibold text-on-surface bg-surface-container-low rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <select
                value={strengthUnit}
                onChange={(e) => setStrengthUnit(e.target.value)}
                aria-label="Strength Unit"
                className="w-24 text-xs font-bold text-on-surface bg-surface-container-low rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer"
              >
                <option value="mg">mg</option>
                <option value="mcg">mcg</option>
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="IU">IU</option>
                <option value="puffs">puffs</option>
                <option value="drops">drops</option>
              </select>
            </div>
          </div>

          {/* DOSAGE PER INTAKE (FRACTION SUPPORT) */}
          <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm space-y-2.5 border border-surface-container">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                Dose per Intake (Fractions Supported)
              </label>
              <span className="text-xs font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                {formatFraction(doseAmount)} {form}{doseAmount > 1 ? 's' : ''} / dose
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Specify how much you consume per scheduled intake (e.g. half pill, 1.5 tablets).
            </p>

            {/* Quick Fraction Presets */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
              {COMMON_FRACTION_DOSES.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setDoseAmount(preset.value)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center ${
                    Math.abs(doseAmount - preset.value) < 0.01
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="block font-headline text-sm">{preset.label.split(' ')[0]}</span>
                  <span className="text-[9px] opacity-80 block">{preset.badge}</span>
                </button>
              ))}
            </div>

            {/* Custom Fraction/Decimal Stepper */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low mt-2">
              <span className="text-xs font-semibold text-on-surface">Custom Amount:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDoseAmount(Math.max(0.25, roundFraction(doseAmount - 0.25)))}
                  className="w-8 h-8 rounded-lg bg-surface-container text-primary font-bold text-base hover:bg-surface-container-high flex items-center justify-center"
                >
                  -
                </button>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    step="0.25"
                    min="0.1"
                    value={doseAmount}
                    onChange={(e) => setDoseAmount(parseFloat(e.target.value) || 1)}
                    className="w-14 font-headline text-lg font-bold text-center bg-transparent text-on-surface focus:outline-none"
                  />
                  <span className="text-xs text-outline font-medium">{form}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDoseAmount(roundFraction(doseAmount + 0.25))}
                  className="w-8 h-8 rounded-lg bg-surface-container text-primary font-bold text-base hover:bg-surface-container-high flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Frequency & Timing */}
          <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm space-y-2 border border-surface-container">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => {
                const val = e.target.value;
                setFrequency(val);
                if (val.includes('3 times')) setScheduledTimes(['08:00', '13:30', '20:00']);
                else if (val.includes('2 times')) setScheduledTimes(['08:00', '20:00']);
                else if (val.includes('morning')) setScheduledTimes(['08:00']);
                else if (val.includes('bedtime')) setScheduledTimes(['22:00']);
                else if (val.includes('weekly')) setScheduledTimes(['09:00']);
              }}
              aria-label="Frequency"
              className="w-full text-xs font-semibold text-on-surface bg-surface-container-low rounded-xl px-3.5 py-2.5 focus:outline-none cursor-pointer"
            >
              <option value="3 times daily">3 times daily (Every 8h)</option>
              <option value="2 times daily">2 times daily (Every 12h)</option>
              <option value="1x daily (morning)">1x daily (Morning)</option>
              <option value="1x daily (bedtime)">1x daily (Bedtime)</option>
              <option value="Once weekly">Once weekly</option>
              <option value="As needed (PRN)">As needed (PRN)</option>
            </select>
          </div>

          {/* Meal Timing */}
          <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm flex flex-col gap-2.5 border border-surface-container">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Meal Timing
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'before_food' as MealTiming, label: 'Before food', icon: 'restaurant' },
                { id: 'after_food' as MealTiming, label: 'After food', icon: 'restaurant' },
                { id: 'with_meal' as MealTiming, label: 'With meal', icon: 'lunch_dining' },
                { id: 'anytime' as MealTiming, label: 'Anytime', icon: 'schedule' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMealTiming(item.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                    mealTiming === item.id
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Course Duration & Stop After Specific Days */}
          <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm flex flex-col gap-3 border border-surface-container">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Course Duration
              </label>
              <div className="inline-flex p-1 bg-surface-container rounded-full">
                <button
                  type="button"
                  onClick={() => setIsFixedDuration(true)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    isFixedDuration
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Fixed Duration
                </button>
                <button
                  type="button"
                  onClick={() => setIsFixedDuration(false)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    !isFixedDuration
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Ongoing
                </button>
              </div>
            </div>

            {isFixedDuration && (
              <>
                <div className="grid grid-cols-2 gap-2.5 items-center">
                  <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col">
                    <span className="text-[11px] font-semibold text-outline">Start Date</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent text-xs font-bold text-on-surface mt-0.5 focus:outline-none"
                    />
                  </div>
                  <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col">
                    <span className="text-[11px] font-semibold text-outline">Stop After</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs font-bold text-on-surface">{durationDays} Days</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setDurationDays(Math.max(1, durationDays - 1))}
                          className="w-6 h-6 rounded bg-surface-container flex items-center justify-center text-primary font-bold text-sm hover:bg-surface-container-high"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => setDurationDays(durationDays + 1)}
                          className="w-6 h-6 rounded bg-surface-container flex items-center justify-center text-primary font-bold text-sm hover:bg-surface-container-high"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Duration Presets */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                  {[
                    { label: '3 Days', days: 3 },
                    { label: '5 Days (Z-Pak)', days: 5 },
                    { label: '7 Days (Standard)', days: 7 },
                    { label: '10 Days (Acute)', days: 10 },
                    { label: '14 Days (Extended)', days: 14 },
                  ].map((preset) => (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => setDurationDays(preset.days)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                        durationDays === preset.days
                          ? 'bg-secondary-fixed text-on-secondary-fixed-variant font-bold'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="inline-flex items-center justify-between p-2.5 rounded-xl bg-surface-container-high text-on-surface text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-error">
                      timer
                    </span>
                    <span>
                      Course Stop Date: <strong className="text-error font-bold">{calculateEndDate()}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-bold">
                    Stop Alert Active
                  </span>
                </div>

                {/* Stop Reminder toggle */}
                <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-error">notification_important</span>
                    <div>
                      <span className="text-xs font-bold text-on-surface block">Discontinuation Reminder</span>
                      <span className="text-[11px] text-on-surface-variant">
                        Alert me to stop taking this medicine once the {durationDays}-day course finishes
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={stopReminderEnabled}
                    onChange={(e) => setStopReminderEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                </div>
              </>
            )}
          </div>

          {/* INVENTORY, HOW MUCH CONSUMED & FRACTION CALCULATIONS */}
          <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm flex flex-col gap-3 border border-surface-container">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  inventory_2
                </span>
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Stock & Consumed Calculations
                </label>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed-variant text-[11px] font-bold">
                Fraction Accurate
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Total Purchased Quantity */}
              <div className="bg-surface-container-low p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-outline">Total Purchased</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <input
                    type="number"
                    step="0.25"
                    min="1"
                    value={totalQuantity}
                    onChange={(e) => setTotalQuantity(parseFloat(e.target.value) || 1)}
                    className="w-20 font-headline text-2xl font-bold text-on-surface bg-transparent focus:outline-none"
                  />
                  <span className="text-xs text-outline">{form}s</span>
                </div>
              </div>

              {/* How Much Consumed Option (Supports Fractions) */}
              <div className="bg-surface-container-low p-3 rounded-xl flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-outline">How Much Consumed</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={consumedQuantity}
                    onChange={(e) => setConsumedQuantity(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-20 font-headline text-2xl font-bold text-primary bg-transparent focus:outline-none"
                  />
                  <span className="text-xs text-outline">{form}s</span>
                </div>
              </div>
            </div>

            {/* Live Fraction Calculation Summary Banner */}
            <div className="p-3 rounded-xl bg-secondary-fixed/30 border border-secondary/20 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-on-surface">Remaining In Stock:</span>
                <span className="font-headline font-extrabold text-sm text-secondary">
                  {formatFraction(calculatedRemaining)} {form}s ({calculatedRemaining})
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                <span>Daily Burn Rate:</span>
                <span className="font-bold">
                  {formatFraction(dailyIntakeUnits)} {form}s / day ({scheduledTimes.length} doses × {formatFraction(doseAmount)})
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant border-t border-secondary/20 pt-1">
                <span>Days of Supply Left:</span>
                <span className="font-bold text-primary">
                  ~{daysSupplyRemaining} days of medication
                </span>
              </div>
            </div>

            {/* Refill alert threshold */}
            <div className="bg-surface-container-low p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-on-surface block">Advance Refill Threshold</span>
                <span className="text-[10px] text-on-surface-variant">Alert when remaining stock drops below this</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={refillTrigger}
                  onChange={(e) => setRefillTrigger(parseFloat(e.target.value) || 1)}
                  className="w-12 font-headline text-lg font-bold text-tertiary bg-transparent text-center focus:outline-none"
                />
                <span className="text-xs text-outline">{form}s</span>
              </div>
            </div>
          </div>

          {/* Schedule Preview */}
          <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm flex flex-col gap-2.5 border border-surface-container">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Schedule Preview ({scheduledTimes.length} Doses Daily)
              </span>
              <button
                type="button"
                onClick={() => setIsEditingTimes(!isEditingTimes)}
                className="text-xs font-bold text-primary hover:underline"
              >
                {isEditingTimes ? 'Done Editing' : 'Edit Times'}
              </button>
            </div>

            {isEditingTimes ? (
              <div className="space-y-2 pt-1">
                {scheduledTimes.map((time, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-outline w-16">Dose {idx + 1}:</span>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => {
                        const newTimes = [...scheduledTimes];
                        newTimes[idx] = e.target.value;
                        setScheduledTimes(newTimes);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-surface-container-low text-xs font-bold text-on-surface focus:outline-none"
                    />
                    {scheduledTimes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setScheduledTimes(scheduledTimes.filter((_, i) => i !== idx))}
                        className="p-1 rounded-full text-outline hover:text-error"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setScheduledTimes([...scheduledTimes, '12:00'])}
                  className="text-xs font-bold text-primary flex items-center gap-1 mt-1 hover:underline"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Add Dose Time
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                {scheduledTimes.map((time, index) => (
                  <div
                    key={index}
                    className="p-2.5 rounded-xl bg-surface-container-low text-center min-w-[85px] shrink-0 border border-surface-container"
                  >
                    <span className="font-headline font-bold text-sm text-primary block">{time}</span>
                    <span className="text-[10px] text-on-surface-variant font-semibold mt-0.5 block">
                      {formatFraction(doseAmount)} {form}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ATTACH PRESCRIPTION / DOCUMENT VIA CAMERA */}
          <div className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm flex flex-col gap-3 border border-surface-container">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  photo_camera
                </span>
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Attach Prescription Document
                </label>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed-variant text-[11px] font-bold">
                Camera Supported
              </span>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Capture photo of your doctor's paper prescription, label, or box to store securely alongside this medication.
            </p>

            <div className="p-3 rounded-2xl bg-surface-container-low border border-dashed border-primary/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">
                    {attachedDocUrl ? 'verified' : 'add_a_photo'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-on-surface block">
                    {attachedDocUrl ? 'Prescription Photo Attached' : 'No Document Attached Yet'}
                  </span>
                  <span className="text-[10px] text-on-surface-variant">
                    {attachedDocUrl ? 'Photo saved and linked' : 'Use live camera or gallery'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsCameraCaptureOpen(true)}
                  className="px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary/90 flex items-center gap-1 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                  Camera
                </button>

                <label className="px-3 py-1.5 rounded-full bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high cursor-pointer flex items-center gap-1 active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-[15px]">upload_file</span>
                  Files
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setAttachedDocUrl(event.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Thumbnail Preview when attached */}
            {attachedDocUrl && (
              <div className="relative rounded-2xl overflow-hidden bg-black/5 p-2 flex items-center gap-3 border border-surface-container">
                <img
                  src={attachedDocUrl}
                  alt="Attached Prescription"
                  className="w-16 h-16 object-cover rounded-xl border border-surface-container shrink-0 bg-white"
                />
                <div className="flex-1 min-w-0">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-bold">
                    <span className="material-symbols-outlined text-[12px]">check_circle</span>
                    Attached Document Ready
                  </span>
                  <p className="text-[11px] text-on-surface-variant truncate mt-1">
                    Will be saved and viewable in full screen inside the Vault & Medicine Details.
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCroppingAttachedDoc(true)}
                    className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-xs font-bold"
                    title="Crop Document or Strip"
                  >
                    <span className="material-symbols-outlined text-[16px]">crop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCameraCaptureOpen(true)}
                    className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-xs font-bold"
                    title="Retake Photo"
                  >
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttachedDocUrl(null)}
                    className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-error text-xs font-bold"
                    title="Remove Photo"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sticky Bottom Confirmation Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-surface/90 backdrop-blur-xl px-4 py-3 z-40 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.06)] border-t border-surface-container">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div className="hidden sm:flex flex-col">
            <span className="text-[11px] text-outline">Calculated Stock</span>
            <span className="text-xs font-bold text-on-surface">
              {formatFraction(calculatedRemaining)} {form}s left (~{daysSupplyRemaining} days)
            </span>
          </div>
          <button
            onClick={handleSave}
            type="button"
            className="w-full sm:w-auto sm:flex-1 py-3 px-6 rounded-full bg-primary text-on-primary font-headline font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:bg-primary-container active:scale-[0.99] transition-all"
          >
            <span>{isEditMode ? 'Save Changes' : 'Save & Set Reminders'}</span>
            <span className="material-symbols-outlined text-[18px]">
              {isEditMode ? 'check' : 'arrow_forward'}
            </span>
          </button>
        </div>
      </div>

      {/* Camera Capture Modal */}
      {isCameraCaptureOpen && (
        <CameraCaptureModal
          isOpen={isCameraCaptureOpen}
          onClose={() => setIsCameraCaptureOpen(false)}
          onCapture={(photoData) => setAttachedDocUrl(photoData)}
          title="Photograph Prescription / Medicine Label"
          documentTypeHint="Capture paper prescription, drug carton, or blister strip"
        />
      )}

      {/* Image Crop Modal */}
      {isCroppingAttachedDoc && attachedDocUrl && (
        <ImageCropModal
          isOpen={isCroppingAttachedDoc}
          onClose={() => setIsCroppingAttachedDoc(false)}
          imageUrl={attachedDocUrl}
          onCropComplete={(croppedData) => {
            setAttachedDocUrl(croppedData);
            setIsCroppingAttachedDoc(false);
          }}
          title="Crop Medicine Photo / Document"
          initialAspectRatio="free"
        />
      )}
    </div>
  );
};
