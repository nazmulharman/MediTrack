import React, { useState } from 'react';
import { HealthVitalLog } from '../types/medicine';

interface VitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePatientId: string;
  onSaveVital: (vital: HealthVitalLog) => void;
}

export const VitalsModal: React.FC<VitalsModalProps> = ({
  isOpen,
  onClose,
  activePatientId,
  onSaveVital,
}) => {
  if (!isOpen) return null;

  const [vitalType, setVitalType] = useState<'blood_sugar' | 'blood_pressure'>('blood_pressure');

  // Blood Pressure states
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [pulse, setPulse] = useState<number>(72);

  // Blood Sugar states
  const [sugarValue, setSugarValue] = useState<number>(95);
  const [sugarContext, setSugarContext] = useState<'fasting' | 'post_prandial' | 'random' | 'before_bed'>('fasting');

  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  // Blood pressure classification
  const getBPClassification = () => {
    if (systolic < 120 && diastolic < 80) {
      return { label: 'Normal BP', color: 'bg-secondary-fixed text-on-secondary-fixed-variant' };
    } else if (systolic <= 129 && diastolic < 80) {
      return { label: 'Elevated BP', color: 'bg-primary-fixed text-on-primary-fixed-variant' };
    } else if (systolic <= 139 || diastolic <= 89) {
      return { label: 'Stage 1 Hypertension', color: 'bg-secondary-container text-on-secondary-container' };
    } else {
      return { label: 'Stage 2 Hypertension', color: 'bg-error-container text-on-error-container' };
    }
  };

  // Sugar classification
  const getSugarClassification = () => {
    if (sugarContext === 'fasting') {
      if (sugarValue < 70) return { label: 'Low Glucose (Hypoglycemia)', color: 'bg-error-container text-on-error-container' };
      if (sugarValue <= 99) return { label: 'Normal Fasting Range', color: 'bg-secondary-fixed text-on-secondary-fixed-variant' };
      if (sugarValue <= 125) return { label: 'Pre-diabetes Range', color: 'bg-primary-fixed text-on-primary-fixed-variant' };
      return { label: 'High Fasting Glucose', color: 'bg-error-container text-on-error-container' };
    } else {
      if (sugarValue < 140) return { label: 'Normal Post-Meal Range', color: 'bg-secondary-fixed text-on-secondary-fixed-variant' };
      if (sugarValue <= 199) return { label: 'Elevated Post-Meal', color: 'bg-primary-fixed text-on-primary-fixed-variant' };
      return { label: 'High Glucose', color: 'bg-error-container text-on-error-container' };
    }
  };

  const bpStatus = getBPClassification();
  const sugarStatus = getSugarClassification();

  const handleSave = () => {
    const newLog: HealthVitalLog = {
      id: `vital-${Date.now()}`,
      patientId: activePatientId,
      type: vitalType,
      date,
      time,
      notes: notes.trim() || undefined,
      ...(vitalType === 'blood_pressure'
        ? { systolic, diastolic, pulse }
        : { sugarValue, sugarContext }),
    };

    onSaveVital(newLog);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col border border-surface-container">
        {/* Header */}
        <div className="p-4 bg-surface-container-low flex items-center justify-between border-b border-surface-container">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[22px]">vital_signs</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-on-surface">
                Daily Vitals Tracker
              </h3>
              <p className="text-[11px] text-on-surface-variant font-medium">
                Log Blood Pressure & Blood Sugar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Tab selector */}
        <div className="p-4 pb-0">
          <div className="grid grid-cols-2 p-1 bg-surface-container rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setVitalType('blood_pressure')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                vitalType === 'blood_pressure'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">favorite</span>
              <span>Blood Pressure</span>
            </button>
            <button
              type="button"
              onClick={() => setVitalType('blood_sugar')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                vitalType === 'blood_sugar'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">bloodtype</span>
              <span>Blood Sugar</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-4">
          {vitalType === 'blood_pressure' ? (
            /* Blood Pressure inputs */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low p-3.5 rounded-2xl text-center flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Systolic (Upper)
                  </span>
                  <div className="flex items-baseline justify-center gap-1 my-1">
                    <input
                      type="number"
                      value={systolic}
                      onChange={(e) => setSystolic(parseInt(e.target.value) || 0)}
                      className="w-20 font-headline font-extrabold text-3xl text-primary bg-transparent text-center focus:outline-none"
                    />
                    <span className="text-[11px] text-outline font-semibold">mmHg</span>
                  </div>
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSystolic(Math.max(60, systolic - 5))}
                      className="w-7 h-7 rounded-lg bg-surface-container font-bold text-xs hover:bg-surface-container-high"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => setSystolic(systolic + 5)}
                      className="w-7 h-7 rounded-lg bg-surface-container font-bold text-xs hover:bg-surface-container-high"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="bg-surface-container-low p-3.5 rounded-2xl text-center flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Diastolic (Lower)
                  </span>
                  <div className="flex items-baseline justify-center gap-1 my-1">
                    <input
                      type="number"
                      value={diastolic}
                      onChange={(e) => setDiastolic(parseInt(e.target.value) || 0)}
                      className="w-20 font-headline font-extrabold text-3xl text-on-surface bg-transparent text-center focus:outline-none"
                    />
                    <span className="text-[11px] text-outline font-semibold">mmHg</span>
                  </div>
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDiastolic(Math.max(40, diastolic - 5))}
                      className="w-7 h-7 rounded-lg bg-surface-container font-bold text-xs hover:bg-surface-container-high"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiastolic(diastolic + 5)}
                      className="w-7 h-7 rounded-lg bg-surface-container font-bold text-xs hover:bg-surface-container-high"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Heart Pulse */}
              <div className="p-3 bg-surface-container-low rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-[20px]">ecg_heart</span>
                  <span className="text-xs font-bold text-on-surface">Pulse (Heart Rate)</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    value={pulse}
                    onChange={(e) => setPulse(parseInt(e.target.value) || 70)}
                    className="w-14 font-headline font-bold text-lg text-primary text-center bg-transparent focus:outline-none"
                  />
                  <span className="text-xs text-outline font-semibold">bpm</span>
                </div>
              </div>

              {/* Classification Tag */}
              <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${bpStatus.color}`}>
                <span>Assessment:</span>
                <span>{bpStatus.label} ({systolic}/{diastolic} mmHg)</span>
              </div>
            </div>
          ) : (
            /* Blood Sugar inputs */
            <div className="space-y-3">
              <div className="bg-surface-container-low p-4 rounded-2xl text-center flex flex-col items-center">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Blood Glucose Reading
                </span>
                <div className="flex items-baseline justify-center gap-1.5 my-2">
                  <input
                    type="number"
                    value={sugarValue}
                    onChange={(e) => setSugarValue(parseInt(e.target.value) || 0)}
                    className="w-24 font-headline font-extrabold text-4xl text-primary bg-transparent text-center focus:outline-none"
                  />
                  <span className="text-xs text-outline font-bold">mg/dL</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSugarValue(Math.max(40, sugarValue - 5))}
                    className="w-9 h-8 rounded-xl bg-surface-container font-bold text-sm hover:bg-surface-container-high flex items-center justify-center"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => setSugarValue(sugarValue + 5)}
                    className="w-9 h-8 rounded-xl bg-surface-container font-bold text-sm hover:bg-surface-container-high flex items-center justify-center"
                  >
                    +5
                  </button>
                </div>
              </div>

              {/* Context timing buttons */}
              <div>
                <span className="text-[11px] font-bold text-outline uppercase tracking-wider block mb-1.5">
                  Timing / Context
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'fasting' as const, label: 'Fasting (Morning)' },
                    { id: 'post_prandial' as const, label: '2h Post-Meal' },
                    { id: 'random' as const, label: 'Random Check' },
                    { id: 'before_bed' as const, label: 'Before Bedtime' },
                  ].map((ctx) => (
                    <button
                      key={ctx.id}
                      type="button"
                      onClick={() => setSugarContext(ctx.id)}
                      className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                        sugarContext === ctx.id
                          ? 'bg-primary text-on-primary shadow-sm font-bold'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {ctx.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sugar Status */}
              <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${sugarStatus.color}`}>
                <span>Glucose Evaluation:</span>
                <span>{sugarStatus.label}</span>
              </div>
            </div>
          )}

          {/* Date, Time & Optional Note */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2 rounded-xl bg-surface-container-low">
              <span className="text-[10px] font-bold text-outline block">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-on-surface focus:outline-none w-full"
              />
            </div>
            <div className="p-2 rounded-xl bg-surface-container-low">
              <span className="text-[10px] font-bold text-outline block">Time</span>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-transparent text-xs font-bold text-on-surface focus:outline-none w-full"
              />
            </div>
          </div>

          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional context (e.g., Felt dizzy, after 30m brisk walk)..."
            className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs font-medium text-on-surface placeholder:text-outline focus:outline-none"
          />
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container-low border-t border-surface-container flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full bg-surface-container text-on-surface-variant font-bold text-xs hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            Record Vitals
          </button>
        </div>
      </div>
    </div>
  );
};
