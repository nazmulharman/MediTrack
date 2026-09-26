import React, { useState } from 'react';
import { Medicine } from '../types/medicine';
import { formatFraction } from '../utils/fractionUtils';

interface MedicinesTabProps {
  medicines: Medicine[];
  onSelectMedicine: (medicine: Medicine) => void;
  onOpenAddMedicine: () => void;
  onOpenRefill: (medicine: Medicine) => void;
  onEditMedicine?: (medicine: Medicine) => void;
}

export const MedicinesTab: React.FC<MedicinesTabProps> = ({
  medicines,
  onSelectMedicine,
  onOpenAddMedicine,
  onOpenRefill,
  onEditMedicine,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'low_stock' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPastCourses, setShowPastCourses] = useState(false);

  // Filter medicines
  const filteredMedicines = medicines.filter((med) => {
    const matchesSearch =
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (med.condition && med.condition.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (med.doctorName && med.doctorName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filter === 'active') return med.status === 'active';
    if (filter === 'completed') return med.status === 'completed';
    if (filter === 'low_stock')
      return med.status === 'active' && med.remainingQuantity <= med.refillTrigger;
    return true;
  });

  const activeMedicines = filteredMedicines.filter((m) => m.status === 'active');
  const completedMedicines = medicines.filter((m) => m.status === 'completed');

  const lowStockCount = medicines.filter(
    (m) => m.status === 'active' && m.remainingQuantity <= m.refillTrigger
  ).length;

  return (
    <div className="flex flex-col w-full space-y-4 pb-28 pt-2">
      {/* Cabinet Health Hero Card */}
      <div className="rounded-3xl bg-surface-container-high/60 p-4 border border-primary/10 shadow-sm flex items-center justify-between">
        <div className="flex flex-col gap-1 min-w-0 pr-2">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed/60 text-on-secondary-fixed-variant text-[11px] font-bold w-fit">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            Cabinet Health 96%
          </div>
          <h2 className="font-headline font-bold text-xl text-on-surface tracking-tight">
            Medicine Cabinet
          </h2>
          <p className="text-xs text-on-surface-variant font-medium">
            {medicines.filter((m) => m.status === 'active').length} ongoing regimes •{' '}
            {lowStockCount} requires refill attention
          </p>
        </div>

        {/* 3/4 Gauge */}
        <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
            <circle
              className="text-surface-container"
              cx="24"
              cy="24"
              fill="none"
              r="19"
              stroke="currentColor"
              strokeWidth="4"
            />
            <circle
              className="text-primary"
              cx="24"
              cy="24"
              fill="none"
              r="19"
              stroke="currentColor"
              strokeDasharray="119.38"
              strokeDashoffset="29.8"
              strokeLinecap="round"
              strokeWidth="4"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-headline font-extrabold text-sm text-primary">3/4</span>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative flex items-center">
        <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-outline pointer-events-none">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search medicines, conditions, or doctors"
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-container-low text-on-surface text-xs font-semibold placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 transition-all border border-transparent focus:border-primary/20"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 text-outline hover:text-on-surface"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setFilter('all')}
          type="button"
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            filter === 'all'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span>All</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
            {medicines.length}
          </span>
        </button>

        <button
          onClick={() => setFilter('active')}
          type="button"
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            filter === 'active'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span>Active</span>
          <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface-variant text-[10px]">
            {medicines.filter((m) => m.status === 'active').length}
          </span>
        </button>

        <button
          onClick={() => setFilter('low_stock')}
          type="button"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            filter === 'low_stock'
              ? 'bg-error text-on-error shadow-sm'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-error" />
          <span>Low Stock</span>
          <span className="px-1.5 py-0.2 rounded-full bg-error-container text-on-error-container text-[10px]">
            {lowStockCount}
          </span>
        </button>

        <button
          onClick={() => setFilter('completed')}
          type="button"
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            filter === 'completed'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span>Completed</span>
        </button>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <h3 className="font-headline font-bold text-sm text-on-surface">Active Courses</h3>
          <span className="px-2 py-0.5 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed-variant text-[11px] font-bold">
            {activeMedicines.length} Prescriptions
          </span>
        </div>
        <span className="text-[11px] font-semibold text-outline">Sorted by Urgency</span>
      </div>

      {/* Active Courses Cards */}
      <div className="flex flex-col gap-3">
        {activeMedicines.map((med) => {
          const isLowStock = med.remainingQuantity <= med.refillTrigger;
          const isFixed = med.isFixedDuration;
          const completionPct = isFixed
            ? Math.min(100, Math.round(((med.currentDay || 4) / (med.durationDays || 7)) * 100))
            : med.adherenceRate;

          // Rail color
          let railColor = 'bg-primary';
          let iconBg = 'bg-primary/10 text-primary';
          if (med.name.toLowerCase().includes('amoxicillin')) {
            railColor = 'bg-error';
            iconBg = 'bg-error-container text-on-error-container';
          } else if (med.name.toLowerCase().includes('atorvastatin')) {
            railColor = 'bg-secondary';
            iconBg = 'bg-secondary-container text-on-secondary-container';
          } else if (med.name.toLowerCase().includes('metformin')) {
            railColor = 'bg-tertiary';
            iconBg = 'bg-tertiary-fixed text-on-tertiary-fixed';
          }

          return (
            <article
              key={med.id}
              className="relative bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-surface-container hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${railColor}`} />

              <div className="pl-1">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {med.form === 'capsule'
                          ? 'vaccines'
                          : med.form === 'liquid'
                          ? 'water_bottle'
                          : 'pill'}
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4
                          onClick={() => onSelectMedicine(med)}
                          className="font-headline font-bold text-base text-on-surface truncate cursor-pointer hover:text-primary transition-colors"
                        >
                          {med.name}
                        </h4>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                          {med.strength}
                          {med.strengthUnit}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant font-medium mt-0.5 truncate">
                        {med.condition || `${med.frequency}`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectMedicine(med)}
                    aria-label="Medicine options"
                    className="p-1 rounded-full text-outline hover:text-on-surface"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </div>

                {/* Timing row */}
                <div className="flex items-center justify-between text-xs text-on-surface-variant mt-2.5 pt-2 border-t border-surface-container-low flex-wrap gap-1">
                  <span className="flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[15px] text-outline">
                      schedule
                    </span>
                    {med.frequency} • {med.mealTiming.replace('_', ' ')}
                  </span>
                  <span className="text-primary font-bold text-[11px]">
                    Next: Today, {med.scheduledTimes[1] || med.scheduledTimes[0] || '1:30 PM'}
                  </span>
                </div>

                {/* Course progress bar if fixed */}
                {isFixed && (
                  <div className="mt-2.5 flex flex-col gap-1.5 p-2.5 rounded-xl bg-surface-container-low border border-surface-container">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-error">timer</span>
                        Day {med.currentDay || 4} of {med.durationDays || 7} (Ends {med.endDate || 'soon'})
                      </span>
                      <span className="text-primary">{completionPct}% completed</span>
                    </div>
                    <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-outline font-semibold pt-0.5">
                      <span className="flex items-center gap-1 text-error">
                        <span className="material-symbols-outlined text-[12px]">notifications_active</span>
                        Stop Reminder: Auto-remind on final day
                      </span>
                      <span>Stop Date: {med.endDate || 'Oct 28'}</span>
                    </div>
                  </div>
                )}

                {/* Adherence info if ongoing */}
                {!isFixed && (
                  <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold text-on-surface-variant p-2 rounded-xl bg-surface-container-low">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-secondary">
                        repeat
                      </span>
                      Ongoing Chronic Course
                    </span>
                    <span className="text-secondary font-bold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[14px]">trending_up</span>
                      {med.adherenceRate}% 30-day Adherence
                    </span>
                  </div>
                )}

                {/* Consumed & Stock row */}
                <div className="mt-2.5 p-2 rounded-xl bg-surface-container-low flex items-center justify-between text-[11px] text-on-surface-variant">
                  <span>Consumed: <strong className="text-primary font-bold">{formatFraction(med.consumedQuantity || Math.max(0, med.totalQuantity - med.remainingQuantity))}</strong> / {med.totalQuantity} {med.form}s</span>
                  <span>Intake: <strong>{formatFraction(med.doseAmount || 1)} {med.form}/dose</strong></span>
                </div>

                {/* Stock alert & Action buttons */}
                <div className="mt-3 flex items-center justify-between pt-1 flex-wrap gap-2">
                  {isLowStock ? (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-container text-on-error-container text-[11px] font-bold">
                      <span className="material-symbols-outlined text-[13px]">warning</span>
                      <span>
                        {formatFraction(med.remainingQuantity)} {med.form}s left • {Math.max(1, Math.floor(med.remainingQuantity / ((med.scheduledTimes.length || 1) * (med.doseAmount || 1))))} days supply
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed-variant text-[11px] font-bold">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      <span>
                        {formatFraction(med.remainingQuantity)} {med.form}s left • ~{Math.floor(med.remainingQuantity / ((med.scheduledTimes.length || 1) * (med.doseAmount || 1)))} days
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    {onEditMedicine && (
                      <button
                        onClick={() => onEditMedicine(med)}
                        type="button"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container text-primary text-xs font-bold hover:bg-surface-container-high transition-all"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                        <span>Edit</span>
                      </button>
                    )}
                    <button
                      onClick={() => onOpenRefill(med)}
                      type="button"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary/90 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[14px]">local_pharmacy</span>
                      <span>Refill</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Past & Completed Courses Accordion */}
      {completedMedicines.length > 0 && (
        <div className="rounded-2xl bg-surface-container-low border border-surface-container overflow-hidden">
          <button
            onClick={() => setShowPastCourses(!showPastCourses)}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-surface-container transition-colors"
            type="button"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">archive</span>
              <span className="font-headline font-bold text-xs text-on-surface">
                Past & Completed Courses
              </span>
              <span className="px-2 py-0.2 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold">
                {completedMedicines.length}
              </span>
            </div>
            <span className="material-symbols-outlined text-outline text-[18px]">
              {showPastCourses ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {showPastCourses && (
            <div className="p-3.5 pt-0 space-y-2">
              {completedMedicines.map((med) => (
                <div
                  key={med.id}
                  onClick={() => onSelectMedicine(med)}
                  className="p-3 rounded-xl bg-surface-container-lowest flex items-center justify-between cursor-pointer hover:border-primary/40 border border-transparent transition-all"
                >
                  <div>
                    <h5 className="font-headline font-bold text-xs text-on-surface">{med.name}</h5>
                    <p className="text-[11px] text-outline">
                      {med.strength}
                      {med.strengthUnit} • Completed on {med.endDate || 'Recent'}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-bold">
                    Completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sticky Bottom Add Medicine Button */}
      <div className="sticky bottom-20 z-40 flex justify-center w-full pt-1">
        <button
          onClick={onOpenAddMedicine}
          className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary text-on-primary font-headline font-bold text-sm shadow-xl hover:bg-primary-container active:scale-95 transition-all"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>Add Medicine</span>
        </button>
      </div>
    </div>
  );
};
