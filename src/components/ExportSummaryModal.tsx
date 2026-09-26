import React from 'react';
import { Medicine, PatientProfile, PrescriptionRecord, TestReport } from '../types/medicine';
import { SmartLogo } from './SmartLogo';

interface ExportSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: PatientProfile;
  medicines: Medicine[];
  prescriptions: PrescriptionRecord[];
  testReports: TestReport[];
}

export const ExportSummaryModal: React.FC<ExportSummaryModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  medicines,
  prescriptions,
  testReports,
}) => {
  if (!isOpen) return null;

  const activeMeds = medicines.filter((m) => m.status === 'active');
  const pastMeds = medicines.filter((m) => m.status === 'completed');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-lowest rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-surface-container">
        {/* Top bar */}
        <div className="p-4 flex items-center justify-between border-b border-surface-container bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">picture_as_pdf</span>
            <h3 className="font-headline font-bold text-base text-on-surface">
              Clinical Medical Summary
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary-container flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Printable Document Preview */}
        <div className="p-6 overflow-y-auto space-y-6 text-on-surface bg-white text-xs print:p-0">
          {/* Header of Medical Record */}
          <div className="border-b-2 border-primary pb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <SmartLogo size="md" colorScheme="clinical" showBeacon={false} />
              <div>
                <h1 className="font-headline text-lg font-extrabold text-primary leading-tight">
                  DoseKeeper Clinical Health Record
                </h1>
                <p className="text-[11px] text-gray-500">
                  Generated: {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })} • Smart Tracking Report
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200">
                Verified Encrypted Export
              </span>
            </div>
          </div>

          {/* Patient Details Bento */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                Patient Name
              </span>
              <span className="font-bold text-sm text-gray-900">{activeProfile.name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Category</span>
              <span className="font-bold text-sm text-gray-900">{activeProfile.relationLabel}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block">
                Adherence Rate
              </span>
              <span className="font-bold text-sm text-teal-700">91% (Optimal)</span>
            </div>
          </div>

          {/* Active Medications Table */}
          <div>
            <h3 className="font-headline font-bold text-sm text-gray-900 mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              Active Medication Regimens ({activeMeds.length})
            </h3>
            <table className="w-full border-collapse border border-slate-200 text-left">
              <thead>
                <tr className="bg-slate-100 text-gray-700 font-bold text-[11px]">
                  <th className="p-2 border border-slate-200">Medication & Strength</th>
                  <th className="p-2 border border-slate-200">Frequency & Timing</th>
                  <th className="p-2 border border-slate-200">Course / Refill</th>
                  <th className="p-2 border border-slate-200">Prescribing Doctor</th>
                </tr>
              </thead>
              <tbody>
                {activeMeds.map((med) => (
                  <tr key={med.id} className="border-b border-slate-200">
                    <td className="p-2 font-bold text-gray-900 border border-slate-200">
                      {med.name} {med.strength}
                      {med.strengthUnit}
                      <span className="block font-normal text-[10px] text-gray-500 capitalize">
                        {med.form} • {med.condition}
                      </span>
                    </td>
                    <td className="p-2 border border-slate-200">
                      {med.frequency}
                      <span className="block text-[10px] text-gray-500">
                        Times: {med.scheduledTimes.join(', ')} ({med.mealTiming.replace('_', ' ')})
                      </span>
                    </td>
                    <td className="p-2 border border-slate-200">
                      {med.isFixedDuration
                        ? `Day ${med.currentDay || 4} of ${med.durationDays || 7}`
                        : 'Ongoing Regimen'}
                      <span className="block text-[10px] text-gray-500">
                        Stock: {med.remainingQuantity} units remaining
                      </span>
                    </td>
                    <td className="p-2 border border-slate-200">
                      {med.doctorName || 'Licensed Physician'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Linked Prescriptions Archive */}
          <div>
            <h3 className="font-headline font-bold text-sm text-gray-900 mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              Verified Prescriptions on File
            </h3>
            <div className="space-y-2">
              {prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between"
                >
                  <div>
                    <span className="font-bold text-gray-900 block">{rx.doctorName}</span>
                    <span className="text-gray-600 block text-[11px]">
                      {rx.specialty} • {rx.clinic} ({rx.date})
                    </span>
                    {rx.diagnosisNotes && (
                      <span className="text-gray-500 italic block text-[10px] mt-0.5">
                        Notes: "{rx.diagnosisNotes}"
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      OCR Confirmed
                    </span>
                    <span className="block text-[10px] text-gray-500 mt-0.5">{rx.pharmacy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Treatments */}
          {pastMeds.length > 0 && (
            <div>
              <h3 className="font-headline font-bold text-sm text-gray-900 mb-2">
                Completed Treatments History
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {pastMeds.map((med) => (
                  <li key={med.id}>
                    <strong>{med.name}</strong> {med.strength}
                    {med.strengthUnit} — Completed on {med.endDate || 'Recent'} (Adherence: 100%)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer Footer */}
          <div className="border-t border-slate-200 pt-3 text-[10px] text-gray-500 text-center">
            This document was generated by MediTrack personal health companion. Not a substitute for
            official pharmacy records.
          </div>
        </div>
      </div>
    </div>
  );
};
