import React, { useState } from 'react';
import { PrescriptionRecord, TestReport, DoctorVisit, PatientProfile, HealthVitalLog } from '../types/medicine';

interface VaultTabProps {
  prescriptions: PrescriptionRecord[];
  testReports: TestReport[];
  visits: DoctorVisit[];
  profiles: PatientProfile[];
  vitals: HealthVitalLog[];
  onOpenZoom: (title: string, subtitle: string, imageUrl: string) => void;
  onOpenScanner: () => void;
  onOpenAddReport: () => void;
  onOpenAddPrescription?: () => void;
  onOpenVitals: () => void;
  onExportPDF: () => void;
  onDeleteReport?: (reportId: string) => void;
}

export const VaultTab: React.FC<VaultTabProps> = ({
  prescriptions,
  testReports,
  visits,
  profiles,
  vitals,
  onOpenZoom,
  onOpenScanner,
  onOpenAddReport,
  onOpenAddPrescription,
  onOpenVitals,
  onExportPDF,
  onDeleteReport,
}) => {
  const [activePatientFilter, setActivePatientFilter] = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<'prescriptions' | 'labs' | 'vitals' | 'visits' | 'all'>('prescriptions');
  const [reportTypeFilter, setReportTypeFilter] = useState<string>('all');
  const [vitalTypeFilter, setVitalTypeFilter] = useState<'all' | 'blood_sugar' | 'blood_pressure'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtering
  const filteredPrescriptions = prescriptions.filter((rx) => {
    const matchesPatient = activePatientFilter === 'all' || rx.patientId === activePatientFilter;
    const matchesSearch =
      rx.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.linkedMedicineNames.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rx.diagnosisNotes && rx.diagnosisNotes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPatient && matchesSearch;
  });

  const filteredLabs = testReports.filter((lab) => {
    const matchesPatient = activePatientFilter === 'all' || lab.patientId === activePatientFilter;
    const matchesType = reportTypeFilter === 'all' || lab.reportType === reportTypeFilter;
    const matchesSearch =
      lab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.facility.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lab.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lab.doctorName && lab.doctorName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPatient && matchesType && matchesSearch;
  });

  const filteredVisits = visits.filter((visit) => {
    const matchesPatient = activePatientFilter === 'all' || visit.patientId === activePatientFilter;
    const matchesSearch =
      visit.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visit.clinic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visit.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPatient && matchesSearch;
  });

  const filteredVitals = vitals.filter((v) => {
    const matchesPatient = activePatientFilter === 'all' || v.patientId === activePatientFilter;
    const matchesType = vitalTypeFilter === 'all' || v.type === vitalTypeFilter;
    const matchesSearch =
      (v.notes && v.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      v.date.includes(searchQuery);
    return matchesPatient && matchesType && matchesSearch;
  });

  // Calculate vital stats
  const latestSugar = vitals.find((v) => (activePatientFilter === 'all' || v.patientId === activePatientFilter) && v.type === 'blood_sugar');
  const latestBP = vitals.find((v) => (activePatientFilter === 'all' || v.patientId === activePatientFilter) && v.type === 'blood_pressure');

  const getSugarBadge = (value?: number, context?: string) => {
    if (!value) return { text: 'N/A', cls: 'bg-surface-container text-on-surface' };
    if (context === 'fasting') {
      if (value < 70) return { text: `${value} mg/dL • Low Glucose`, cls: 'bg-error-container text-on-error-container' };
      if (value <= 99) return { text: `${value} mg/dL • Normal Fasting`, cls: 'bg-secondary-fixed text-on-secondary-fixed-variant' };
      if (value <= 125) return { text: `${value} mg/dL • Pre-diabetes`, cls: 'bg-primary-fixed text-on-primary-fixed-variant' };
      return { text: `${value} mg/dL • High Glucose`, cls: 'bg-error-container text-on-error-container' };
    } else {
      if (value < 140) return { text: `${value} mg/dL • Normal Post-Meal`, cls: 'bg-secondary-fixed text-on-secondary-fixed-variant' };
      if (value <= 199) return { text: `${value} mg/dL • Elevated Post-Meal`, cls: 'bg-primary-fixed text-on-primary-fixed-variant' };
      return { text: `${value} mg/dL • High Glucose`, cls: 'bg-error-container text-on-error-container' };
    }
  };

  const getBPBadge = (systolic?: number, diastolic?: number) => {
    if (!systolic || !diastolic) return { text: 'N/A', cls: 'bg-surface-container text-on-surface' };
    if (systolic < 120 && diastolic < 80) return { text: `${systolic}/${diastolic} • Normal BP`, cls: 'bg-secondary-fixed text-on-secondary-fixed-variant' };
    if (systolic <= 129 && diastolic < 80) return { text: `${systolic}/${diastolic} • Elevated`, cls: 'bg-primary-fixed text-on-primary-fixed-variant' };
    if (systolic <= 139 || diastolic <= 89) return { text: `${systolic}/${diastolic} • Stage 1 HTN`, cls: 'bg-secondary-container text-on-secondary-container' };
    return { text: `${systolic}/${diastolic} • Stage 2 HTN`, cls: 'bg-error-container text-on-error-container' };
  };

  return (
    <div className="flex flex-col w-full space-y-4 pb-28 pt-2">
      {/* Safety Trust Banner */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-full bg-secondary-fixed/40 text-on-secondary-fixed-variant shadow-sm border border-secondary/20">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="material-symbols-outlined text-[16px] text-secondary shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            enhanced_encryption
          </span>
          <span className="text-[11px] font-semibold truncate">
            On-Device Encrypted • HIPAA & Privacy Compliant
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] text-primary font-bold px-2 py-0.5 rounded-full bg-surface-container-lowest shrink-0 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Safe
        </span>
      </div>

      {/* Patient Selector Pill Rail */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
            Patient Records
          </span>
          <button
            onClick={() => setActivePatientFilter('all')}
            className="text-primary text-xs font-bold flex items-center gap-0.5 hover:opacity-80 transition-opacity"
            type="button"
          >
            <span className="material-symbols-outlined text-[14px]">refresh</span>
            Reset View
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-4 px-4">
          <button
            onClick={() => setActivePatientFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm shrink-0 transition-all ${
              activePatientFilter === 'all'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">folder_shared</span>
            <span>All Records</span>
          </button>

          {profiles.map((p) => {
            const isActive = activePatientFilter === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePatientFilter(p.id)}
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm shrink-0 transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-surface-container-highest text-on-surface text-[10px] flex items-center justify-center font-bold">
                  {p.initials}
                </span>
                <span>{p.name}</span>
                {p.relation === 'child' && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-surface-container text-on-surface-variant">
                    Child
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Action Hub (Store Report, Attach Prescription, Log Vitals, Export) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onOpenAddReport}
          type="button"
          className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-primary text-on-primary font-headline font-bold text-xs shadow-md hover:bg-primary/90 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">photo_camera</span>
          <span>+ Store Lab / Report</span>
        </button>

        <button
          onClick={onOpenAddPrescription || onOpenScanner}
          type="button"
          className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-secondary-container text-on-secondary-container font-headline font-bold text-xs shadow-sm hover:opacity-90 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">document_scanner</span>
          <span>+ Attach Prescription</span>
        </button>
      </div>

      {/* Search & Export Action Bar */}
      <div className="flex items-center gap-2.5">
        <div className="flex-1 relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-[18px] text-outline pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search report, vitals, doctor, clinic..."
            className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-surface-container-low text-on-surface text-xs font-semibold placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 border border-transparent focus:border-primary/20 transition-all"
          />
        </div>

        <button
          onClick={onExportPDF}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-surface-container-low text-primary text-xs font-bold hover:bg-surface-container shadow-sm active:scale-95 transition-all shrink-0 border border-primary/10"
          type="button"
        >
          <span className="material-symbols-outlined text-[17px]">share</span>
          <span>Export PDF</span>
        </button>
      </div>

      {/* Segmented Vault Categories Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-surface-container-low shadow-sm overflow-x-auto no-scrollbar border border-surface-container">
        <button
          onClick={() => setActiveCategory('prescriptions')}
          className={`flex-1 min-w-[95px] py-1.5 px-2 rounded-xl text-xs text-center font-bold transition-all ${
            activeCategory === 'prescriptions'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          Prescriptions ({filteredPrescriptions.length})
        </button>
        <button
          onClick={() => setActiveCategory('labs')}
          className={`flex-1 min-w-[105px] py-1.5 px-2 rounded-xl text-xs text-center font-bold transition-all ${
            activeCategory === 'labs'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          Lab Reports ({filteredLabs.length})
        </button>
        <button
          onClick={() => setActiveCategory('vitals')}
          className={`flex-1 min-w-[110px] py-1.5 px-2 rounded-xl text-xs text-center font-bold transition-all ${
            activeCategory === 'vitals'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          Sugar & BP ({filteredVitals.length})
        </button>
        <button
          onClick={() => setActiveCategory('visits')}
          className={`flex-1 min-w-[80px] py-1.5 px-2 rounded-xl text-xs text-center font-bold transition-all ${
            activeCategory === 'visits'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          Visits ({filteredVisits.length})
        </button>
        <button
          onClick={() => setActiveCategory('all')}
          className={`flex-1 min-w-[55px] py-1.5 px-2 rounded-xl text-xs text-center font-bold transition-all ${
            activeCategory === 'all'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          All
        </button>
      </div>

      {/* LAB REPORTS VIEW (Medical Report Storage) */}
      {(activeCategory === 'labs' || activeCategory === 'all') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[20px]">science</span>
              <span className="font-headline font-bold text-sm text-on-surface">Medical Diagnostic Reports</span>
            </div>
            <button
              onClick={onOpenAddReport}
              type="button"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-[15px]">add_circle</span>
              Add Report
            </button>
          </div>

          {/* Sub-filter for report types */}
          {activeCategory === 'labs' && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'All Reports' },
                { id: 'blood', label: 'Blood Tests' },
                { id: 'radiology', label: 'X-Rays & Scans' },
                { id: 'mri_ct', label: 'MRI / CT' },
                { id: 'cardio', label: 'Cardiology ECG' },
                { id: 'pathology', label: 'Pathology' },
                { id: 'urine', label: 'Urine Tests' },
              ].map((rf) => (
                <button
                  key={rf.id}
                  onClick={() => setReportTypeFilter(rf.id)}
                  type="button"
                  className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
                    reportTypeFilter === rf.id
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>
          )}

          {/* Medical Reports List */}
          {filteredLabs.length === 0 ? (
            <div className="p-8 rounded-3xl bg-surface-container-lowest text-center border border-surface-container space-y-2">
              <span className="material-symbols-outlined text-4xl text-outline">description</span>
              <p className="font-headline font-bold text-sm text-on-surface">No Medical Reports Stored Yet</p>
              <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
                Store blood tests, X-rays, MRI scans, and pathology reports in one secure vault.
              </p>
              <button
                onClick={onOpenAddReport}
                type="button"
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                Store First Report
              </button>
            </div>
          ) : (
            filteredLabs.map((lab) => {
              const isNormal = lab.flag === 'normal';
              const isAttention = lab.flag === 'attention';
              const isCritical = lab.flag === 'critical';

              return (
                <article
                  key={lab.id}
                  className="flex flex-col rounded-3xl bg-surface-container-lowest p-4 shadow-sm border border-surface-container hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      isCritical ? 'bg-error' : isAttention ? 'bg-primary-fixed-dim' : 'bg-secondary'
                    }`}
                  />
                  <div className="pl-1 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[22px]">
                            {lab.reportType === 'blood'
                              ? 'bloodtype'
                              : lab.reportType === 'radiology'
                              ? 'radiology'
                              : lab.reportType === 'cardio'
                              ? 'ecg_heart'
                              : 'science'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-headline font-bold text-sm text-on-surface truncate">
                            {lab.title}
                          </h4>
                          <p className="text-xs text-on-surface-variant font-medium">
                            {lab.facility} • {lab.date}
                          </p>
                          {lab.doctorName && (
                            <p className="text-[11px] text-outline">Ordered by: {lab.doctorName}</p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          isCritical
                            ? 'bg-error-container text-on-error-container'
                            : isAttention
                            ? 'bg-primary-fixed text-on-primary-fixed-variant'
                            : 'bg-secondary-fixed text-on-secondary-fixed-variant'
                        }`}
                      >
                        {isCritical ? 'Critical' : isAttention ? 'Attention' : 'Normal Range'}
                      </span>
                    </div>

                    <p className="p-3 rounded-xl bg-surface-container-low text-xs text-on-surface leading-relaxed">
                      {lab.summary}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-surface-container-low">
                      <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">
                        {lab.reportType.toUpperCase()} REPORT
                      </span>
                      <div className="flex items-center gap-2">
                        {onDeleteReport && (
                          <button
                            onClick={() => onDeleteReport(lab.id)}
                            type="button"
                            className="p-1 rounded-full text-outline hover:text-error transition-colors"
                            title="Delete Report"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            onOpenZoom(
                              lab.title,
                              `${lab.facility} • ${lab.date}`,
                              lab.fileUrl ||
                                'https://lh3.googleusercontent.com/aida-public/AB6AXuBHjyE7LWXZ4VQQT2vmwGd3kbZ2EIhsX5yItNqh7FM9Uy7M6s50LnS8kdrsXt90y44sar04mVv3-9phPhmuiW48SsPfIYNLP9rfp2-PVYVe6U4gOq58ye65tib00M7ygOq3Ii8AyfiegxmvDh05kdrItJjxCzLDXFglDhtStUfoFq-zs-AqTCkkh_wYxStsJ5ECiwt1NlTUyhmcOhBrRgIHVC5ZVfG2jVTdHxMdR7UEDE1gEUwFTRch'
                            )
                          }
                          className="text-primary font-bold hover:underline flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[15px]">zoom_in</span>
                          Inspect Document
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* VITALS VIEW (Sugar & Blood Pressure Log) */}
      {(activeCategory === 'vitals' || activeCategory === 'all') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[20px]">vital_signs</span>
              <span className="font-headline font-bold text-sm text-on-surface">Daily Sugar & Blood Pressure</span>
            </div>
            <button
              onClick={onOpenVitals}
              type="button"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-[15px]">add_circle</span>
              Log Vital
            </button>
          </div>

          {/* Vitals Quick Summary Bento */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-outline uppercase tracking-wider">Blood Sugar</span>
                <span className="material-symbols-outlined text-[18px] text-primary">bloodtype</span>
              </div>
              <div className="mt-1.5">
                <span className="font-headline font-extrabold text-xl text-on-surface">
                  {latestSugar?.sugarValue || 94}{' '}
                  <span className="text-xs font-semibold text-outline">mg/dL</span>
                </span>
                <div className="mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block ${getSugarBadge(latestSugar?.sugarValue || 94, latestSugar?.sugarContext || 'fasting').cls}`}>
                    {getSugarBadge(latestSugar?.sugarValue || 94, latestSugar?.sugarContext || 'fasting').text}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-outline uppercase tracking-wider">Blood Pressure</span>
                <span className="material-symbols-outlined text-[18px] text-error">favorite</span>
              </div>
              <div className="mt-1.5">
                <span className="font-headline font-extrabold text-xl text-on-surface">
                  {latestBP?.systolic || 118}/{latestBP?.diastolic || 76}{' '}
                  <span className="text-xs font-semibold text-outline">mmHg</span>
                </span>
                <div className="mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block ${getBPBadge(latestBP?.systolic || 118, latestBP?.diastolic || 76).cls}`}>
                    {getBPBadge(latestBP?.systolic || 118, latestBP?.diastolic || 76).text}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Vitals Sub-filters */}
          {activeCategory === 'vitals' && (
            <div className="flex items-center gap-1.5 pb-1">
              <button
                onClick={() => setVitalTypeFilter('all')}
                type="button"
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  vitalTypeFilter === 'all'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                All Vitals ({filteredVitals.length})
              </button>
              <button
                onClick={() => setVitalTypeFilter('blood_sugar')}
                type="button"
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  vitalTypeFilter === 'blood_sugar'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                Blood Sugar
              </button>
              <button
                onClick={() => setVitalTypeFilter('blood_pressure')}
                type="button"
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  vitalTypeFilter === 'blood_pressure'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                Blood Pressure
              </button>
            </div>
          )}

          {/* Vitals Entries List */}
          {filteredVitals.length === 0 ? (
            <div className="p-6 rounded-2xl bg-surface-container-lowest text-center border border-surface-container">
              <span className="material-symbols-outlined text-3xl text-outline">ecg_heart</span>
              <p className="font-headline font-bold text-xs text-on-surface mt-1">No Vitals Logged for this Patient</p>
              <button
                onClick={onOpenVitals}
                type="button"
                className="mt-2 px-3.5 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-sm"
              >
                Log Sugar & Blood Pressure
              </button>
            </div>
          ) : (
            filteredVitals.map((v) => {
              const isSugar = v.type === 'blood_sugar';
              const badge = isSugar
                ? getSugarBadge(v.sugarValue, v.sugarContext)
                : getBPBadge(v.systolic, v.diastolic);

              return (
                <div
                  key={v.id}
                  className="p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-sm flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSugar ? 'bg-primary-fixed text-primary' : 'bg-secondary-fixed text-secondary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isSugar ? 'bloodtype' : 'favorite'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-headline font-extrabold text-base text-on-surface">
                          {isSugar
                            ? `${v.sugarValue} mg/dL`
                            : `${v.systolic}/${v.diastolic} mmHg`}
                        </span>
                        <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${badge.cls}`}>
                          {badge.text.split('•')[1] || badge.text}
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                        {v.date} at {v.time} •{' '}
                        {isSugar
                          ? v.sugarContext?.replace('_', ' ').toUpperCase() || 'RANDOM'
                          : `Pulse ${v.pulse || 72} bpm`}
                      </p>
                      {v.notes && (
                        <p className="text-xs text-on-surface-variant italic mt-1 bg-surface-container-low p-2 rounded-lg">
                          "{v.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-outline uppercase shrink-0">
                    {isSugar ? 'Sugar' : 'BP'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* PRESCRIPTIONS VIEW */}
      {(activeCategory === 'prescriptions' || activeCategory === 'all') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[20px]">prescriptions</span>
              <span className="font-headline font-bold text-sm text-on-surface">Doctor Prescriptions</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAddPrescription}
                type="button"
                className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[15px]">add_a_photo</span>
                Attach Photo
              </button>
              <span className="text-outline text-xs">•</span>
              <button
                onClick={onOpenScanner}
                type="button"
                className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[15px]">document_scanner</span>
                OCR Scanner
              </button>
            </div>
          </div>

          {filteredPrescriptions.map((rx) => {
            const isEmma = rx.patientId === 'emma';
            const isCardio = rx.specialty.includes('Cardio');

            return (
              <article
                key={rx.id}
                className="flex flex-col rounded-3xl bg-surface-container-lowest p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border border-surface-container"
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    isCardio ? 'bg-primary' : isEmma ? 'bg-tertiary' : 'bg-secondary'
                  }`}
                />

                <div className="pl-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isCardio
                            ? 'bg-primary-fixed/60 text-primary'
                            : isEmma
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                            : 'bg-secondary-fixed/70 text-secondary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[22px]">
                          {isCardio ? 'cardiology' : isEmma ? 'child_care' : 'hearing'}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h4 className="font-headline font-bold text-sm text-on-surface truncate">
                          {rx.doctorName}
                        </h4>
                        <p className="text-xs text-on-surface-variant font-medium">
                          {rx.specialty} • {rx.clinic}
                        </p>
                        <span className="text-[11px] text-outline mt-0.5 font-medium">
                          Prescribed: {rx.date}
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary px-2.5 py-1 rounded-full bg-primary/10 shrink-0">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      OCR Verified
                    </span>
                  </div>

                  {rx.diagnosisNotes && (
                    <div className="p-3 rounded-2xl bg-surface-container-low text-xs text-on-surface space-y-1">
                      <span className="font-bold text-on-surface block text-[11px] uppercase tracking-wider">
                        Diagnosis & Clinical Directions
                      </span>
                      <p className="leading-relaxed text-on-surface-variant">{rx.diagnosisNotes}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {rx.linkedMedicineNames.map((medName, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container text-xs font-semibold text-on-surface"
                      >
                        <span className="material-symbols-outlined text-[14px] text-primary">pill</span>
                        {medName}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-surface-container-low">
                    <span className="text-outline font-medium">{rx.pharmacy || 'CVS Pharmacy'}</span>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenZoom(
                          `${rx.doctorName} - ${rx.specialty}`,
                          `${rx.clinic} • ${rx.date}`,
                          rx.photoUrl
                        )
                      }
                      className="text-primary font-bold hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">zoom_in</span>
                      View Original Scan
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* DOCTOR VISITS VIEW */}
      {(activeCategory === 'visits' || activeCategory === 'all') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[20px]">medical_services</span>
              <span className="font-headline font-bold text-sm text-on-surface">Doctor Consultations</span>
            </div>
          </div>

          {filteredVisits.map((visit) => (
            <article
              key={visit.id}
              className="flex flex-col rounded-3xl bg-surface-container-lowest p-4 shadow-sm border border-surface-container space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">medical_services</span>
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-sm text-on-surface">
                      {visit.doctorName}
                    </h4>
                    <p className="text-xs text-on-surface-variant font-medium">
                      {visit.clinic} • {visit.date}
                    </p>
                  </div>
                </div>
                {visit.nextFollowUp && (
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Follow-up: {visit.nextFollowUp}
                  </span>
                )}
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low text-xs text-on-surface-variant space-y-1">
                <div className="font-bold text-on-surface">Reason: {visit.reason}</div>
                <p className="leading-relaxed">{visit.summary}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Floating Action Menu */}
      <div className="sticky bottom-20 z-40 flex justify-center w-full pt-1">
        <button
          onClick={onOpenAddReport}
          className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary text-on-primary font-headline font-bold text-sm shadow-xl hover:bg-primary-container active:scale-95 transition-all"
          type="button"
        >
          <span className="material-symbols-outlined text-[22px]">note_add</span>
          <span>Store New Medical Report</span>
        </button>
      </div>
    </div>
  );
};
