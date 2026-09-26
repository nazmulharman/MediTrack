import React, { useState } from 'react';
import { Medicine, DoseItem, PatientProfile } from '../types/medicine';
import { HistoryChartsTab } from './HistoryChartsTab';

interface HistoryTabProps {
  medicines: Medicine[];
  doses: DoseItem[];
  activeProfile: PatientProfile;
  onExportPDF: () => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  medicines,
  doses,
  activeProfile,
  onExportPDF,
}) => {
  const [subTab, setSubTab] = useState<'charts' | 'summary'>('charts');
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | 'all'>('7days');

  // Adherence metrics
  const completedMedicines = medicines.filter((m) => m.status === 'completed');
  const activeMedicines = medicines.filter((m) => m.status === 'active');

  // 7-day mock adherence
  const weekDays = [
    { day: 'Mon', date: 'Oct 18', percent: 100, taken: 4, total: 4 },
    { day: 'Tue', date: 'Oct 19', percent: 100, taken: 4, total: 4 },
    { day: 'Wed', date: 'Oct 20', percent: 75, taken: 3, total: 4 },
    { day: 'Thu', date: 'Oct 21', percent: 100, taken: 5, total: 5 },
    { day: 'Fri', date: 'Oct 22', percent: 100, taken: 5, total: 5 },
    { day: 'Sat', date: 'Oct 23', percent: 80, taken: 4, total: 5 },
    { day: 'Today', date: 'Oct 24', percent: 67, taken: 4, total: 6, current: true },
  ];

  return (
    <div className="flex flex-col w-full space-y-4 pb-28 pt-2">
      {/* Sub-navigation tabs within History Section */}
      <div className="flex items-center p-1.5 rounded-2xl bg-surface-container-high/80 border border-primary/10 shadow-sm">
        <button
          onClick={() => setSubTab('charts')}
          type="button"
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'charts'
              ? 'bg-primary text-on-primary shadow-md'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">bar_chart</span>
          <span>Charts</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              subTab === 'charts'
                ? 'bg-on-primary text-primary'
                : 'bg-primary/10 text-primary'
            }`}
          >
            Recharts
          </span>
        </button>

        <button
          onClick={() => setSubTab('summary')}
          type="button"
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'summary'
              ? 'bg-primary text-on-primary shadow-md'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">fact_check</span>
          <span>Overview & Log</span>
        </button>
      </div>

      {subTab === 'charts' ? (
        <HistoryChartsTab
          medicines={medicines}
          doses={doses}
          activeProfile={activeProfile}
          onExportPDF={onExportPDF}
        />
      ) : (
        <>
          {/* Header Summary */}
          <div className="rounded-3xl bg-surface-container-high/60 p-4 border border-primary/10 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">query_stats</span>
                <h2 className="font-headline font-bold text-xl text-on-surface">Adherence Insights</h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-xs font-bold">
                🔥 14-Day Streak
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Adherence report for <strong className="text-on-surface">{activeProfile.name}</strong>.
              High compliance ensures treatment efficacy and avoids antibiotic resistance.
            </p>

            {/* Range switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container-low w-fit">
              <button
                onClick={() => setTimeRange('7days')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeRange === '7days'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant'
                }`}
                type="button"
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setTimeRange('30days')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeRange === '30days'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant'
                }`}
                type="button"
              >
                30 Days
              </button>
              <button
                onClick={() => setTimeRange('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeRange === 'all'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant'
                }`}
                type="button"
              >
                All-Time
              </button>
            </div>
          </div>

      {/* Compliance Ring & Stats Card */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-surface-container shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
            Overall Rate
          </span>
          <div className="my-1">
            <span className="font-headline text-3xl font-extrabold text-primary">91%</span>
            <p className="text-[10px] text-secondary font-bold">+4% vs last week</p>
          </div>
          <span className="text-[10px] text-outline font-medium">Optimal clinical zone</span>
        </div>

        <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-surface-container shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
            On-Time
          </span>
          <div className="my-1">
            <span className="font-headline text-3xl font-extrabold text-on-surface">86%</span>
            <p className="text-[10px] text-outline font-medium">Within 30m window</p>
          </div>
          <span className="text-[10px] text-primary font-bold">29 doses</span>
        </div>

        <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-surface-container shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
            Missed / Skip
          </span>
          <div className="my-1">
            <span className="font-headline text-3xl font-extrabold text-error">4%</span>
            <p className="text-[10px] text-error font-semibold">1 dose skipped</p>
          </div>
          <span className="text-[10px] text-outline font-medium">Low liability risk</span>
        </div>
      </div>

      {/* 7-Day Visual Adherence Chart */}
      <div className="rounded-3xl bg-surface-container-lowest p-4 border border-surface-container shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-bold text-sm text-on-surface">Weekly Dose Adherence</h3>
          <span className="text-xs text-primary font-bold">Target: 90%+</span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-2 items-end h-36">
          {weekDays.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[10px] font-bold text-on-surface-variant">
                {item.percent}%
              </span>
              <div className="w-full bg-surface-container-low rounded-t-xl overflow-hidden h-24 flex items-end">
                <div
                  className={`w-full rounded-t-xl transition-all duration-500 ${
                    item.percent >= 90
                      ? 'bg-primary'
                      : item.percent >= 70
                      ? 'bg-secondary-fixed-dim'
                      : 'bg-error'
                  }`}
                  style={{ height: `${item.percent}%` }}
                />
              </div>
              <div className="text-center">
                <span
                  className={`text-[11px] font-bold block ${
                    item.current ? 'text-primary' : 'text-on-surface'
                  }`}
                >
                  {item.day}
                </span>
                <span className="text-[9px] text-outline block">{item.date.split(' ')[1]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Past Completed Treatment Courses */}
      <div className="rounded-3xl bg-surface-container-lowest p-4 border border-surface-container shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">history_edu</span>
            <h3 className="font-headline font-bold text-sm text-on-surface">
              Completed Medical Treatments
            </h3>
          </div>
          <span className="text-xs text-outline font-semibold">
            {completedMedicines.length} Courses
          </span>
        </div>

        <div className="space-y-2.5">
          {completedMedicines.map((med) => (
            <div
              key={med.id}
              className="p-3.5 rounded-2xl bg-surface-container-low flex items-start justify-between border border-surface-container"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">check</span>
                </div>
                <div>
                  <h4 className="font-headline font-bold text-sm text-on-surface">{med.name}</h4>
                  <p className="text-xs text-on-surface-variant">
                    {med.strength}
                    {med.strengthUnit} • {med.condition}
                  </p>
                  <p className="text-[11px] text-outline mt-0.5">
                    Course: {med.startDate} → {med.endDate || 'Finished'} (100% adherence)
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-bold shrink-0">
                Course Complete
              </span>
            </div>
          ))}

          <div className="p-3.5 rounded-2xl bg-surface-container-low flex items-start justify-between border border-surface-container">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">medical_services</span>
              </div>
              <div>
                <h4 className="font-headline font-bold text-sm text-on-surface">
                  Ibuprofen 400mg (Post-Dental)
                </h4>
                <p className="text-xs text-on-surface-variant">PRN Pain Relief • 3 Days Course</p>
                <p className="text-[11px] text-outline mt-0.5">Jun 14 - Jun 17, 2024 • Resolved</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold shrink-0">
              Resolved
            </span>
          </div>
        </div>
      </div>

      {/* Export Summary Action Card */}
      <div className="rounded-3xl bg-primary text-on-primary p-5 shadow-lg flex items-center justify-between gap-3">
        <div>
          <h4 className="font-headline font-bold text-base">Share Doctor Visit Summary</h4>
          <p className="text-xs text-on-primary-container mt-0.5 leading-relaxed">
            Compile complete history of active medications, past antibiotic courses, and lab
            results into a standardized clinical PDF.
          </p>
        </div>
        <button
          onClick={onExportPDF}
          type="button"
          className="px-4 py-2.5 rounded-full bg-surface-container-lowest text-primary text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all shrink-0 flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">print</span>
          Export PDF
        </button>
      </div>
    </>
  )}
</div>
  );
};
