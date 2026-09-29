import React, { useState, useRef } from 'react';
import { TestReport } from '../types/medicine';
import { CameraCaptureModal } from './CameraCaptureModal';
import { ImageCropModal } from './ImageCropModal';

interface AddReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePatientId: string;
  onSaveReport: (report: TestReport) => void;
}

const DEFAULT_SAMPLE_REPORT =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD3p6G4qM8wZ_s7kQ7-2R8X6P1T0-Y4B7N1M6L5K8J9H3G2F1E0D9C8B7A6';

export const AddReportModal: React.FC<AddReportModalProps> = ({
  isOpen,
  onClose,
  activePatientId,
  onSaveReport,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState<TestReport['reportType']>('blood');
  const [facility, setFacility] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState('');
  const [flag, setFlag] = useState<TestReport['flag']>('normal');

  // Multi-page document state
  const [pages, setPages] = useState<string[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [cropTarget, setCropTarget] = useState<{
    isOpen: boolean;
    pageIndex: number;
    imageUrl: string;
  }>({
    isOpen: false,
    pageIndex: 0,
    imageUrl: '',
  });

  const [errorMsg, setErrorMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('File size exceeds 10MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImg = event.target?.result as string;
        const nextIndex = pages.length;
        setPages((prev) => [...prev, newImg]);
        setSelectedPageIndex(nextIndex);
        // Automatically open crop modal so user can align & crop margins
        setCropTarget({ isOpen: true, pageIndex: nextIndex, imageUrl: newImg });
        setErrorMsg('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Camera capture
  const handleCameraCapture = (imageDataUrl: string) => {
    setIsCameraOpen(false);
    const nextIndex = pages.length;
    setPages((prev) => [...prev, imageDataUrl]);
    setSelectedPageIndex(nextIndex);
    // Open cropper immediately
    setCropTarget({ isOpen: true, pageIndex: nextIndex, imageUrl: imageDataUrl });
  };

  // Crop completion
  const handleCropComplete = (croppedDataUrl: string) => {
    setPages((prev) => {
      const updated = [...prev];
      if (cropTarget.pageIndex >= 0 && cropTarget.pageIndex < updated.length) {
        updated[cropTarget.pageIndex] = croppedDataUrl;
      }
      return updated;
    });
    setCropTarget({ isOpen: false, pageIndex: 0, imageUrl: '' });
  };

  const handleRemovePage = (idxToRemove: number) => {
    const newPages = pages.filter((_, i) => i !== idxToRemove);
    setPages(newPages);
    if (selectedPageIndex >= newPages.length) {
      setSelectedPageIndex(Math.max(0, newPages.length - 1));
    }
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
      facility: facility.trim() || 'Laboratory Diagnostics',
      doctorName: doctorName.trim() || undefined,
      date,
      summary: summary.trim() || 'Diagnostic report attached and encrypted in vault.',
      flag,
      fileUrl: pages[0] || undefined,
      pages: pages.length > 0 ? pages : undefined,
    };

    onSaveReport(newReport);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-inverse-surface/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-surface-container">
          {/* Header */}
          <div className="p-4 bg-surface-container-low flex items-center justify-between border-b border-surface-container shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[22px]">note_add</span>
              </div>
              <div>
                <h3 className="font-headline font-bold text-base text-on-surface">
                  Store Medical Report
                </h3>
                <p className="text-[11px] text-on-surface-variant font-medium">
                  Support multiple pages, image cropping & diagnostic findings
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

          {/* Form Content */}
          <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Document Pages Strip & Crop Section */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-dashed border-primary/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      collections_bookmark
                    </span>
                    <span>Report Pages ({pages.length})</span>
                  </span>
                  <span className="text-[10px] text-on-surface-variant">
                    Add multiple lab pages, MRI films, or diagnostic sheets
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90 flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                    <span>Camera</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold shadow-xs flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[15px]">upload_file</span>
                    <span>Upload</span>
                  </button>
                </div>
              </div>

              {/* Pages Grid */}
              {pages.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {pages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl p-1.5 bg-surface-container-lowest border border-surface-container flex flex-col gap-1.5 group"
                    >
                      <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-black/5">
                        <img
                          src={imgUrl}
                          alt={`Page ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded-full bg-black/70 text-white text-[9px] font-bold">
                          Page {idx + 1}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setCropTarget({ isOpen: true, pageIndex: idx, imageUrl: imgUrl })
                          }
                          className="px-2 py-0.5 rounded-md bg-primary/10 hover:bg-primary text-primary hover:text-on-primary text-[10px] font-bold flex items-center gap-0.5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[12px]">crop</span>
                          <span>Crop</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemovePage(idx)}
                          className="w-5 h-5 rounded-md hover:bg-error-container/40 text-outline hover:text-error flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-[13px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add more placeholder */}
                  <div
                    onClick={() => setIsCameraOpen(true)}
                    className="border border-dashed border-primary/30 rounded-xl p-2 flex flex-col items-center justify-center text-center gap-1 cursor-pointer hover:bg-surface-container-high/40 aspect-[3/4]"
                  >
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      add_photo_alternate
                    </span>
                    <span className="text-[11px] font-bold text-primary">+ Add Page</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container text-center space-y-1">
                  <span className="material-symbols-outlined text-outline text-[28px]">
                    description
                  </span>
                  <p className="text-xs font-semibold text-on-surface">No pages attached yet</p>
                  <p className="text-[11px] text-on-surface-variant">
                    Take a photo or upload pages to store full lab reports.
                  </p>
                </div>
              )}
            </div>

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
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30 border border-surface-container"
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
                        ? 'bg-primary text-on-primary font-bold shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-surface-container'
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
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none border border-surface-container"
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
                  placeholder="Dr. Full Name"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none border border-surface-container"
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
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none border border-surface-container"
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
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs font-bold text-on-surface focus:outline-none cursor-pointer border border-surface-container"
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
                Summary / Diagnostic Interpretation
              </label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="e.g. Platelet count normal at 245K. Mild vitamin D deficiency noted (22 ng/mL)."
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs font-medium text-on-surface placeholder:text-outline focus:outline-none border border-surface-container"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-surface-container-low border-t border-surface-container flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full bg-surface-container text-on-surface-variant font-bold text-xs hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              <span>Save Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Camera Modal */}
      {isCameraOpen && (
        <CameraCaptureModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handleCameraCapture}
          title="Capture Report Page"
          documentTypeHint="Center the lab report page or test document"
        />
      )}

      {/* Image Cropper Modal */}
      {cropTarget.isOpen && cropTarget.imageUrl && (
        <ImageCropModal
          isOpen={cropTarget.isOpen}
          onClose={() => setCropTarget({ isOpen: false, pageIndex: 0, imageUrl: '' })}
          imageUrl={cropTarget.imageUrl}
          onCropComplete={handleCropComplete}
          title={`Crop Report Page ${cropTarget.pageIndex + 1}`}
          initialAspectRatio="document"
        />
      )}
    </>
  );
};
