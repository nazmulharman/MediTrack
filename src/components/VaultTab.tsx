import React, { useState, useEffect } from 'react';
import {
  PrescriptionRecord,
  TestReport,
  DoctorVisit,
  PatientProfile,
  HealthVitalLog,
} from '../types/medicine';
import { DocumentGalleryModal, GalleryItem } from './DocumentGalleryModal';

const DEFAULT_RX_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB9NH81i_mh13YEoZeDKVK8QkskiYTrbGTbRS_NLmkE6fA2aP-h8ybrxF_1ZglrZbhAXL3aCtb8rq6Dec3Kg8sDK_srJ9LdhNRZ-oz7OYo6hysVvTXzEGedy05spJAHvvrYUFzL2ZFlDO_sjsbQUbA16oXP0FQefohElBU8nebDMBXgQ__I5VTJwlu3hu45aPBFBlIP_VLdnkTR7LBcue6ZmQ9c_tP1z38E_00C3utVxDbXnD53pBMT';

const DEFAULT_LAB_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBHjyE7LWXZ4VQQT2vmwGd3kbZ2EIhsX5yItNqh7FM9Uy7M6s50LnS8kdrsXt90y44sar04mVv3-9phPhmuiW48SsPfIYNLP9rfp2-PVYVe6U4gOq58ye65tib00M7ygOq3Ii8AyfiegxmvDh05kdrItJjxCzLDXFglDhtStUfoFq-zs-AqTCkkh_wYxStsJ5ECiwt1NlTUyhmcOhBrRgIHVC5ZVfG2jVTdHxMdR7UEDE1gEUwFTRch';

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
  onExportCalendar?: () => void;
  onOpenGoogleDrive?: () => void;
  onDeleteReport?: (reportId: string) => void;
  onDeletePrescription?: (rxId: string) => void;
  initialViewMode?: 'gallery' | 'list';
  initialCategory?: 'gallery' | 'prescriptions' | 'labs' | 'vitals' | 'visits' | 'all';
  highlightDocId?: string | null;
  onClearHighlight?: () => void;
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
  onExportCalendar,
  onOpenGoogleDrive,
  onDeleteReport,
  onDeletePrescription,
  initialViewMode = 'gallery',
  initialCategory = 'all',
  highlightDocId = null,
  onClearHighlight,
}) => {
  // Primary view mode: 'gallery' shows all prescriptions and reports as a visual photo gallery
  const [viewMode, setViewMode] = useState<'gallery' | 'list'>(initialViewMode);
  const [activePatientFilter, setActivePatientFilter] = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<
    'gallery' | 'prescriptions' | 'labs' | 'vitals' | 'visits' | 'all'
  >(initialCategory);
  const [galleryFilter, setGalleryFilter] = useState<string>('all');
  const [reportTypeFilter, setReportTypeFilter] = useState<string>('all');
  const [vitalTypeFilter, setVitalTypeFilter] = useState<'all' | 'blood_sugar' | 'blood_pressure'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Gallery Modal Lightbox State
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState<boolean>(false);
  const [galleryModalInitialIndex, setGalleryModalInitialIndex] = useState<number>(0);

  // Sync initial props
  useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);

  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  // Clear highlight after 5 seconds
  useEffect(() => {
    if (highlightDocId && onClearHighlight) {
      const timer = setTimeout(() => {
        onClearHighlight();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightDocId, onClearHighlight]);

  // Filter Prescriptions
  const filteredPrescriptions = prescriptions.filter((rx) => {
    const matchesPatient = activePatientFilter === 'all' || rx.patientId === activePatientFilter;
    const matchesSearch =
      rx.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.clinic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.linkedMedicineNames.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rx.diagnosisNotes && rx.diagnosisNotes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPatient && matchesSearch;
  });

  // Filter Labs
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

  // Filter Visits
  const filteredVisits = visits.filter((visit) => {
    const matchesPatient = activePatientFilter === 'all' || visit.patientId === activePatientFilter;
    const matchesSearch =
      visit.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visit.clinic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visit.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPatient && matchesSearch;
  });

  // Filter Vitals
  const filteredVitals = vitals.filter((v) => {
    const matchesPatient = activePatientFilter === 'all' || v.patientId === activePatientFilter;
    const matchesType = vitalTypeFilter === 'all' || v.type === vitalTypeFilter;
    const matchesSearch =
      (v.notes && v.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      v.date.includes(searchQuery);
    return matchesPatient && matchesType && matchesSearch;
  });

  // Build Unified Medical Documents Gallery Items
  const allGalleryItems: GalleryItem[] = [
    ...filteredPrescriptions.map((rx) => {
      const patient = profiles.find((p) => p.id === rx.patientId);
      return {
        id: rx.id,
        type: 'prescription' as const,
        title: `${rx.doctorName} • ${rx.specialty}`,
        subtitle: `${rx.clinic} • ${rx.date}`,
        date: rx.date,
        patientId: rx.patientId,
        patientName: patient?.name || rx.patientId,
        imageUrl: rx.photoUrl || DEFAULT_RX_IMAGE,
        badgeLabel: 'Prescription',
        badgeIcon: 'prescriptions',
        badgeColorCls: 'bg-primary-container text-on-primary-container',
        doctorOrFacility: `${rx.doctorName}, ${rx.specialty} (${rx.clinic})`,
        summaryOrDiagnosis: rx.diagnosisNotes,
        linkedMedicines: rx.linkedMedicineNames,
        pharmacy: rx.pharmacy,
        refillsRemaining: rx.refillsRemaining,
        tags: rx.tags || ['Prescription', rx.specialty],
      };
    }),
    ...filteredLabs.map((lab) => {
      const patient = profiles.find((p) => p.id === lab.patientId);
      const isCritical = lab.flag === 'critical';
      const isAttention = lab.flag === 'attention';
      const badgeCls = isCritical
        ? 'bg-error-container text-on-error-container'
        : isAttention
        ? 'bg-primary-fixed text-on-primary-fixed-variant'
        : 'bg-secondary-fixed text-on-secondary-fixed-variant';

      return {
        id: lab.id,
        type: 'report' as const,
        title: lab.title,
        subtitle: `${lab.facility} • ${lab.date}`,
        date: lab.date,
        patientId: lab.patientId,
        patientName: patient?.name || lab.patientId,
        imageUrl: lab.fileUrl || DEFAULT_LAB_IMAGE,
        badgeLabel:
          lab.reportType === 'blood'
            ? 'Blood Test'
            : lab.reportType === 'radiology'
            ? 'X-Ray / Scan'
            : lab.reportType === 'cardio'
            ? 'Cardio ECG'
            : 'Lab Report',
        badgeIcon:
          lab.reportType === 'blood'
            ? 'bloodtype'
            : lab.reportType === 'radiology'
            ? 'radiology'
            : lab.reportType === 'cardio'
            ? 'ecg_heart'
            : 'science',
        badgeColorCls: badgeCls,
        doctorOrFacility: `${lab.facility}${lab.doctorName ? ` • ${lab.doctorName}` : ''}`,
        summaryOrDiagnosis: lab.summary,
        flag: lab.flag,
        tags: [lab.reportType, lab.facility],
      };
    }),
  ];

  // Gallery Sub-filtering
  const filteredGalleryItems = allGalleryItems.filter((item) => {
    if (galleryFilter === 'all') return true;
    if (galleryFilter === 'prescriptions') return item.type === 'prescription';
    if (galleryFilter === 'labs') return item.type === 'report';
    if (galleryFilter === 'blood') {
      const rawLab = testReports.find((r) => r.id === item.id);
      return rawLab?.reportType === 'blood';
    }
    if (galleryFilter === 'radiology') {
      const rawLab = testReports.find((r) => r.id === item.id);
      return rawLab?.reportType === 'radiology';
    }
    if (galleryFilter === 'cardio') {
      const rawLab = testReports.find((r) => r.id === item.id);
      return rawLab?.reportType === 'cardio';
    }
    return true;
  });

  const openInGalleryModal = (itemIndex: number) => {
    setGalleryModalInitialIndex(itemIndex);
    setIsGalleryModalOpen(true);
  };

  const handleDeleteItem = (id: string, type: 'prescription' | 'report') => {
    if (type === 'prescription' && onDeletePrescription) {
      onDeletePrescription(id);
    } else if (type === 'report' && onDeleteReport) {
      onDeleteReport(id);
    }
  };

  // Vitals stats calculations
  const latestSugar = vitals.find(
    (v) => (activePatientFilter === 'all' || v.patientId === activePatientFilter) && v.type === 'blood_sugar'
  );
  const latestBP = vitals.find(
    (v) => (activePatientFilter === 'all' || v.patientId === activePatientFilter) && v.type === 'blood_pressure'
  );

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
    if (systolic < 120 && diastolic < 80)
      return { text: `${systolic}/${diastolic} • Normal BP`, cls: 'bg-secondary-fixed text-on-secondary-fixed-variant' };
    if (systolic <= 129 && diastolic < 80)
      return { text: `${systolic}/${diastolic} • Elevated`, cls: 'bg-primary-fixed text-on-primary-fixed-variant' };
    if (systolic <= 139 || diastolic <= 89)
      return { text: `${systolic}/${diastolic} • Stage 1 HTN`, cls: 'bg-secondary-container text-on-secondary-container' };
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
            On-Device Encrypted Medical Vault • Private & Secure
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] text-primary font-bold px-2 py-0.5 rounded-full bg-surface-container-lowest shrink-0 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Protected
        </span>
      </div>

      {/* Patient Selector Rail */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
            Patient Vault Records
          </span>
          <button
            onClick={() => setActivePatientFilter('all')}
            className="text-primary text-xs font-bold flex items-center gap-0.5 hover:opacity-80 transition-opacity"
            type="button"
          >
            <span className="material-symbols-outlined text-[14px]">refresh</span>
            All Family
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
            <span>All Records ({allGalleryItems.length})</span>
          </button>

          {profiles.map((p) => {
            const isActive = activePatientFilter === p.id;
            const patientDocsCount = allGalleryItems.filter((i) => i.patientId === p.id).length;
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
                <span className="text-[10px] opacity-75 font-mono">({patientDocsCount})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Action Buttons: Add Lab / Report & Attach Prescription */}
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
            placeholder="Search documents, doctor, clinic, medication..."
            className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-surface-container-low text-on-surface text-xs font-semibold placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 border border-transparent focus:border-primary/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenGoogleDrive && (
            <button
              onClick={onOpenGoogleDrive}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-surface-container-low text-on-surface text-xs font-bold hover:bg-surface-container shadow-sm active:scale-95 transition-all border border-surface-container"
              type="button"
              title="Google Drive Cloud Vault Sync"
            >
              {/* Google Drive SVG */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
              <span className="hidden xs:inline">Drive Sync</span>
            </button>
          )}

          <button
            onClick={onExportPDF}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-surface-container-low text-primary text-xs font-bold hover:bg-surface-container shadow-sm active:scale-95 transition-all border border-primary/10"
            type="button"
            title="Export Clinical Summary PDF"
          >
            <span className="material-symbols-outlined text-[17px]">share</span>
            <span>Export</span>
          </button>
          {onExportCalendar && (
            <button
              onClick={onExportCalendar}
              className="flex items-center gap-1 px-2.5 py-2.5 rounded-2xl bg-surface-container-low text-primary text-xs font-bold hover:bg-surface-container shadow-sm active:scale-95 transition-all border border-primary/10"
              type="button"
              title="Export Dosage Schedule to .ics Calendar"
            >
              <span className="material-symbols-outlined text-[17px]">calendar_month</span>
            </button>
          )}
        </div>
      </div>

      {/* Main View Mode Selector: Gallery View vs Clinical List View */}
      <div className="flex items-center justify-between p-1.5 rounded-2xl bg-surface-container border border-surface-container-high">
        <div className="flex items-center gap-1 flex-1">
          <button
            onClick={() => setViewMode('gallery')}
            type="button"
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-headline font-bold transition-all ${
              viewMode === 'gallery'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span
              className="material-symbols-outlined text-[17px]"
              style={viewMode === 'gallery' ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              photo_library
            </span>
            <span>Gallery View ({allGalleryItems.length})</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            type="button"
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-headline font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span
              className="material-symbols-outlined text-[17px]"
              style={viewMode === 'list' ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              format_list_bulleted
            </span>
            <span>Detailed List</span>
          </button>
        </div>
      </div>

      {/* === 1. GALLERY VIEW (Shows all Prescriptions & Reports like a visual photo gallery) === */}
      {viewMode === 'gallery' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Gallery Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: `All Documents (${allGalleryItems.length})`, icon: 'collections' },
              { id: 'prescriptions', label: `Prescriptions (${filteredPrescriptions.length})`, icon: 'prescriptions' },
              { id: 'labs', label: `Lab Reports (${filteredLabs.length})`, icon: 'science' },
              { id: 'blood', label: 'Blood Tests', icon: 'bloodtype' },
              { id: 'radiology', label: 'X-Rays & Scans', icon: 'radiology' },
              { id: 'cardio', label: 'Cardio ECG', icon: 'ecg_heart' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setGalleryFilter(f.id)}
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                  galleryFilter === f.id
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">{f.icon}</span>
                <span>{f.label}</span>
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          {filteredGalleryItems.length === 0 ? (
            <div className="p-8 rounded-3xl bg-surface-container-lowest text-center border border-surface-container space-y-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">photo_library</span>
              </div>
              <p className="font-headline font-bold text-base text-on-surface">No Medical Documents Found</p>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                Attach doctor prescription scans, blood tests, or diagnostic lab reports to build your visual health gallery.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={onOpenAddPrescription || onOpenScanner}
                  type="button"
                  className="px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                  Add Prescription
                </button>
                <button
                  onClick={onOpenAddReport}
                  type="button"
                  className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">upload_file</span>
                  Store Lab Report
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredGalleryItems.map((item, index) => {
                const isHighlighted = highlightDocId === item.id;
                return (
                  <article
                    key={item.id}
                    onClick={() => openInGalleryModal(index)}
                    className={`group relative flex flex-col rounded-3xl bg-surface-container-lowest border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                      isHighlighted
                        ? 'ring-2 ring-primary ring-offset-2 border-primary shadow-lg animate-pulse'
                        : 'border-surface-container hover:border-primary/40'
                    }`}
                  >
                    {/* Document Preview Image with Aspect Ratio */}
                    <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full bg-surface-container-high overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                      />
                      {/* Gradient overlay for badges */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none" />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1 z-10">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${item.badgeColorCls}`}
                        >
                          <span className="material-symbols-outlined text-[13px]">{item.badgeIcon}</span>
                          <span>{item.badgeLabel}</span>
                        </span>

                        <div className="flex items-center gap-1">
                          {isHighlighted && (
                            <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold animate-bounce shadow">
                              ✨ Just Added
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold backdrop-blur-md">
                            {item.date}
                          </span>
                        </div>
                      </div>

                      {/* Hover / Tap Zoom Action Pill */}
                      <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openInGalleryModal(index);
                          }}
                          className="px-2.5 py-1 rounded-full bg-white/90 hover:bg-white text-on-surface text-[11px] font-bold shadow-md flex items-center gap-1 backdrop-blur-md transition-all active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[14px] text-primary">zoom_in</span>
                          <span>Inspect</span>
                        </button>
                      </div>

                      {/* Patient indicator pill */}
                      {item.patientName && (
                        <div className="absolute bottom-2.5 left-2.5 z-10">
                          <span className="px-2 py-0.5 rounded-full bg-black/65 text-white/90 text-[10px] font-medium backdrop-blur-md">
                            👤 {item.patientName}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Metadata Content */}
                    <div className="p-3.5 flex flex-col justify-between flex-1 gap-2">
                      <div className="space-y-1">
                        <h4 className="font-headline font-bold text-sm text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-on-surface-variant font-medium flex items-center gap-1 line-clamp-1">
                          <span className="material-symbols-outlined text-[14px] text-outline shrink-0">
                            location_on
                          </span>
                          <span>{item.doctorOrFacility}</span>
                        </p>
                      </div>

                      {/* Prescribed Medications Chips (if prescription) */}
                      {item.linkedMedicines && item.linkedMedicines.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          {item.linkedMedicines.map((med, mIdx) => (
                            <span
                              key={mIdx}
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-surface-container text-[11px] font-medium text-on-surface"
                            >
                              <span className="material-symbols-outlined text-[11px] text-primary">pill</span>
                              <span className="truncate max-w-[120px]">{med}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Clinical Summary snippet (if report) */}
                      {item.summaryOrDiagnosis && !item.linkedMedicines && (
                        <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed bg-surface-container-low/70 p-2 rounded-xl">
                          {item.summaryOrDiagnosis}
                        </p>
                      )}

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-surface-container-low text-xs">
                        <span className="text-[11px] font-bold text-primary flex items-center gap-0.5 group-hover:underline">
                          View in Lightbox
                          <span className="material-symbols-outlined text-[13px]">chevron_right</span>
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Delete "${item.title}"?`)) {
                                handleDeleteItem(item.id, item.type);
                              }
                            }}
                            className="p-1 rounded-full text-outline hover:text-error hover:bg-error-container/30 transition-colors"
                            title="Delete Document"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* === 2. LIST VIEW (Traditional Categorized List for Clinical Records) === */}
      {viewMode === 'list' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Segmented Category Sub-tabs */}
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

          {/* PRESCRIPTIONS SECTION IN LIST */}
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
                    Scan
                  </button>
                </div>
              </div>

              {filteredPrescriptions.map((rx) => {
                const isCardio = rx.specialty.includes('Cardio');
                const isEmma = rx.patientId === 'emma';
                const isHighlighted = highlightDocId === rx.id;

                return (
                  <article
                    key={rx.id}
                    className={`flex flex-col rounded-3xl bg-surface-container-lowest p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border ${
                      isHighlighted
                        ? 'border-primary ring-2 ring-primary ring-offset-2 animate-pulse'
                        : 'border-surface-container'
                    }`}
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
                            className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-surface-container cursor-pointer`}
                            onClick={() =>
                              onOpenZoom(
                                `${rx.doctorName} - ${rx.specialty}`,
                                `${rx.clinic} • ${rx.date}`,
                                rx.photoUrl || DEFAULT_RX_IMAGE
                              )
                            }
                          >
                            <img
                              src={rx.photoUrl || DEFAULT_RX_IMAGE}
                              alt={rx.doctorName}
                              className="w-full h-full object-cover"
                            />
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
                            Diagnosis & Directions
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
                        <div className="flex items-center gap-2">
                          {onDeletePrescription && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete prescription from ${rx.doctorName}?`)) {
                                  onDeletePrescription(rx.id);
                                }
                              }}
                              type="button"
                              className="text-outline hover:text-error text-xs p-1"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              onOpenZoom(
                                `${rx.doctorName} - ${rx.specialty}`,
                                `${rx.clinic} • ${rx.date}`,
                                rx.photoUrl || DEFAULT_RX_IMAGE
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
              })}
            </div>
          )}

          {/* LAB REPORTS SECTION IN LIST */}
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

              {filteredLabs.map((lab) => {
                const isNormal = lab.flag === 'normal';
                const isAttention = lab.flag === 'attention';
                const isCritical = lab.flag === 'critical';
                const isHighlighted = highlightDocId === lab.id;

                return (
                  <article
                    key={lab.id}
                    className={`flex flex-col rounded-3xl bg-surface-container-lowest p-4 shadow-sm border hover:shadow-md transition-shadow relative overflow-hidden ${
                      isHighlighted
                        ? 'border-primary ring-2 ring-primary ring-offset-2 animate-pulse'
                        : 'border-surface-container'
                    }`}
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        isCritical ? 'bg-error' : isAttention ? 'bg-primary-fixed-dim' : 'bg-secondary'
                      }`}
                    />
                    <div className="pl-1 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-surface-container cursor-pointer"
                            onClick={() =>
                              onOpenZoom(
                                lab.title,
                                `${lab.facility} • ${lab.date}`,
                                lab.fileUrl || DEFAULT_LAB_IMAGE
                              )
                            }
                          >
                            <img
                              src={lab.fileUrl || DEFAULT_LAB_IMAGE}
                              alt={lab.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-headline font-bold text-sm text-on-surface truncate">
                              {lab.title}
                            </h4>
                            <p className="text-xs text-on-surface-variant font-medium">
                              {lab.facility} • {lab.date}
                            </p>
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
                              onClick={() => {
                                if (window.confirm(`Delete "${lab.title}"?`)) {
                                  onDeleteReport(lab.id);
                                }
                              }}
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
                                lab.fileUrl || DEFAULT_LAB_IMAGE
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
              })}
            </div>
          )}

          {/* VITALS SECTION IN LIST */}
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

              {/* Vitals Bento */}
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
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block ${
                          getSugarBadge(latestSugar?.sugarValue || 94, latestSugar?.sugarContext || 'fasting').cls
                        }`}
                      >
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
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block ${
                          getBPBadge(latestBP?.systolic || 118, latestBP?.diastolic || 76).cls
                        }`}
                      >
                        {getBPBadge(latestBP?.systolic || 118, latestBP?.diastolic || 76).text}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VISITS SECTION IN LIST */}
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
                        <h4 className="font-headline font-bold text-sm text-on-surface">{visit.doctorName}</h4>
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
        </div>
      )}

      {/* Floating Action Menu for Quick Document Store */}
      <div className="sticky bottom-20 z-40 flex justify-center w-full pt-1 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onOpenAddReport}
            className="flex items-center gap-1.5 px-5 py-3 rounded-full bg-primary text-on-primary font-headline font-bold text-xs shadow-xl hover:bg-primary/90 active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[19px]">note_add</span>
            <span>+ Store Report</span>
          </button>
          <button
            onClick={onOpenAddPrescription || onOpenScanner}
            className="flex items-center gap-1.5 px-4 py-3 rounded-full bg-secondary-container text-on-secondary-container font-headline font-bold text-xs shadow-xl hover:opacity-90 active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[19px]">add_a_photo</span>
            <span>+ Attach Rx</span>
          </button>
        </div>
      </div>

      {/* Unified Lightbox Gallery Viewer Modal */}
      {isGalleryModalOpen && (
        <DocumentGalleryModal
          isOpen={isGalleryModalOpen}
          onClose={() => setIsGalleryModalOpen(false)}
          items={filteredGalleryItems}
          initialIndex={galleryModalInitialIndex}
          onDeleteItem={handleDeleteItem}
        />
      )}
    </div>
  );
};
