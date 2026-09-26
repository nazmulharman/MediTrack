import React, { useState } from 'react';
import { TestReport } from '../types/medicine';
import { CameraCaptureModal } from './CameraCaptureModal';

interface AddReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePatientId: string;
  onSaveReport: (report: TestReport) => void;
}

export const AddReportModal: React.FC<AddReportModalProps> = ({
  isOpen,
  onClose,
  activePatientId,
  onSaveReport,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState<TestReport['reportType']>('blood');
  const [facility, setFacility] = useState('Quest Diagnostics');
  const [doctorName, setDoctorName] = useState('Dr. Sarah Collins, MD');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState('');
  const [flag, setFlag] = useState<TestReport['flag']>('normal');
  const [fileUrl, setFileUrl] = useState<string>(
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBHjyE7LWXZ4VQQT2vmwGd3kbZ2EIhsX5yItNqh7FM9Uy7M6s50LnS8kdrsXt90y44sar04mVv3-9phPhmuiW48SsPfIYNLP9rfp2-PVYVe6U4gOq58ye65tib00M7ygOq3Ii8AyfiegxmvDh05kdrItJjxCzLDXFglDhtStUfoFq-zs-AqTCkkh_wYxStsJ5ECiwt1NlTUyhmcOhBrRgIHVC5ZVfG2jVTdHxMdR7UEDE1gEUwFTRch'
  );
  const [hasCustomAttachment, setHasCustomAttachment] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileUrl(event.target?.result as string);
        setHasCustomAttachment(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    setFileUrl(imageDataUrl);
    setHasCustomAttachment(true);
  };

  const handleSave = () => {
    if (!title.trim()) {
      setErrorMsg('Please enter a report or test title');
      return;
    }
    setErrorMsg('');

    const newReport: TestReport = {
      id: `report-${Date.now()}`,
      patientId: activePatientId,
      title: title.trim(),
      reportType,
      facility: facility.trim() || 'Laboratory Facility',
      doctorName: doctorName.trim() || undefined,
      date,
      summary: summary.trim() || 'All values within diagnostic reference standards.',
      flag,
      fileUrl,
    };

    onSaveReport(newReport);
    onClose();
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
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[22px]">note_add</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-on-surface">
                Store Medical Report
              </h3>
              <p className="text-[11px] text-on-surface-variant font-medium">
                Save Blood Tests, MRI, X-Rays & Pathology in Vault
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

        {/* Scrollable Form */}
        <div className="p-4 overflow-y-auto space-y-3.5">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider block">
              Report Title / Test Name *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete Blood Count (CBC) or Chest X-Ray"
              className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider block">
              Report Category
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'blood' as const, label: 'Blood Test', icon: 'bloodtype' },
                { id: 'radiology' as const, label: 'X-Ray / Scan', icon: 'radiology' },
                { id: 'mri_ct' as const, label: 'MRI / CT', icon: 'scanner' },
                { id: 'cardio' as const, label: 'Cardio / ECG', icon: 'ecg_heart' },
                { id: 'pathology' as const, label: 'Pathology', icon: 'microscope' },
                { id: 'urine' as const, label: 'Urine / Renal', icon: 'water_drop' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setReportType(cat.id)}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                    reportType === cat.id
                      ? 'bg-primary text-on-primary font-bold shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Facility & Doctor */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                Lab Facility / Hospital
              </label>
              <input
                type="text"
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                placeholder="Quest, Labcorp, Hospital..."
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                Ordering Doctor
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Dr. Name"
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none"
              />
            </div>
          </div>

          {/* Date & Diagnostic Flag */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                Report Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                Result Flag
              </label>
              <select
                value={flag}
                onChange={(e) => setFlag(e.target.value as any)}
                aria-label="Result Flag"
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs font-bold text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="normal">Normal (Within Baseline)</option>
                <option value="attention">Attention / Follow-up Needed</option>
                <option value="critical">Critical Finding</option>
              </select>
            </div>
          </div>

          {/* Findings Summary */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider block">
              Key Diagnostic Findings & Notes
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Hemoglobin 14.2 g/dL, Cholesterol 180 mg/dL, clean margins, follow up in 6 months."
              className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs font-medium text-on-surface placeholder:text-outline focus:outline-none"
            />
          </div>

          {/* File Document Upload & Live Camera Capture */}
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-dashed border-primary/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">attachment</span>
                <div>
                  <span className="text-xs font-bold text-on-surface block">Attach Report Document</span>
                  <span className="text-[10px] text-on-surface-variant">Capture directly via camera or upload file</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary/90 flex items-center gap-1 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                  Camera
                </button>

                <label className="px-3 py-1.5 rounded-full bg-surface-container text-on-surface text-xs font-bold shadow-sm hover:bg-surface-container-high cursor-pointer flex items-center gap-1 active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-[15px]">upload_file</span>
                  Files
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Document Thumbnail Preview */}
            {fileUrl && (
              <div className="relative rounded-xl overflow-hidden bg-black/5 p-2 flex items-center gap-3 border border-surface-container">
                <img
                  src={fileUrl}
                  alt="Attached Document Preview"
                  className="w-14 h-14 object-cover rounded-lg border border-surface-container shrink-0 bg-white"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-bold">
                      <span className="material-symbols-outlined text-[12px]">check_circle</span>
                      {hasCustomAttachment ? 'Document Attached' : 'Sample Document Preview'}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant truncate mt-1">
                    {hasCustomAttachment ? 'Photo/File attached ready for vault storage' : 'Default report template'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-[11px] font-bold shrink-0 flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-[13px]">refresh</span>
                  Retake
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
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
            Store to Vault
          </button>
        </div>
      </div>

      {/* Live Camera Capture Modal */}
      {isCameraOpen && (
        <CameraCaptureModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handleCameraCapture}
          title="Photograph Report Document"
          documentTypeHint="Center your blood report, prescription, or lab sheet inside the frame"
        />
      )}
    </div>
  );
};
