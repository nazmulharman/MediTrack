import React, { useState } from 'react';
import { PrescriptionRecord } from '../types/medicine';
import { CameraCaptureModal } from './CameraCaptureModal';

interface AddPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePatientId: string;
  onSavePrescription: (prescription: PrescriptionRecord) => void;
}

export const AddPrescriptionModal: React.FC<AddPrescriptionModalProps> = ({
  isOpen,
  onClose,
  activePatientId,
  onSavePrescription,
}) => {
  if (!isOpen) return null;

  const [doctorName, setDoctorName] = useState('Dr. Marcus Vance, MD');
  const [specialty, setSpecialty] = useState('ENT Specialist');
  const [clinic, setClinic] = useState('Apex Sinus & Hearing Clinic');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [medicineNamesInput, setMedicineNamesInput] = useState('Amoxicillin 500mg, Fluticasone Nasal Spray');
  const [diagnosisNotes, setDiagnosisNotes] = useState('Acute bacterial rhinosinusitis. Complete full course.');
  const [pharmacy, setPharmacy] = useState('CVS Pharmacy #4128');
  const [refillsRemaining, setRefillsRemaining] = useState<number>(1);
  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB9NH81i_mh13YEoZeDKVK8QkskiYTrbGTbRS_NLmkE6fA2aP-h8ybrxF_1ZglrZbhAXL3aCtb8rq6Dec3Kg8sDK_srJ9LdhNRZ-oz7OYo6hysVvTXzEGedy05spJAHvvrYUFzL2ZFlDO_sjsbQUbA16oXP0FQefohElBU8nebDMBXgQ__I5VTJwlu3hu45aPBFBlIP_VLdnkTR7LBcue6ZmQ9c_tP1z38E_00C3utVxDbXnD53pBMT'
  );
  const [hasCustomPhoto, setHasCustomPhoto] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoUrl(event.target?.result as string);
        setHasCustomPhoto(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    setPhotoUrl(imageDataUrl);
    setHasCustomPhoto(true);
  };

  const handleSave = () => {
    if (!doctorName.trim()) {
      setErrorMsg('Please enter doctor name');
      return;
    }
    setErrorMsg('');

    const medNames = medicineNamesInput
      .split(',')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    const newPrescription: PrescriptionRecord = {
      id: `rx-${Date.now()}`,
      patientId: activePatientId,
      doctorName: doctorName.trim(),
      specialty: specialty.trim() || 'General Medicine',
      clinic: clinic.trim() || 'Medical Clinic',
      date,
      photoUrl,
      linkedMedicineIds: [],
      linkedMedicineNames: medNames.length > 0 ? medNames : ['Prescribed Medication'],
      diagnosisNotes: diagnosisNotes.trim() || undefined,
      pharmacy: pharmacy.trim() || undefined,
      refillsRemaining,
      ocrVerified: true,
      category: 'prescriptions',
    };

    onSavePrescription(newPrescription);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-surface-container">
        {/* Header */}
        <div className="p-4 bg-surface-container-low flex items-center justify-between border-b border-surface-container">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[22px]">prescriptions</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-on-surface">
                Attach Doctor Prescription
              </h3>
              <p className="text-[11px] text-on-surface-variant font-medium">
                Capture paper Rx document via camera or gallery
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

          {/* Camera / Attachment Card */}
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-dashed border-primary/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">photo_camera</span>
                <div>
                  <span className="text-xs font-bold text-on-surface block">Prescription Document Photo</span>
                  <span className="text-[10px] text-on-surface-variant">Live camera snap or gallery upload</span>
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
            <div className="relative rounded-xl overflow-hidden bg-black/5 p-2 flex items-center gap-3 border border-surface-container">
              <img
                src={photoUrl}
                alt="Prescription Scan"
                className="w-16 h-16 object-cover rounded-lg border border-surface-container shrink-0 bg-white"
              />
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-bold">
                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                  {hasCustomPhoto ? 'Captured Photo Attached' : 'Sample Prescription Active'}
                </span>
                <p className="text-[11px] text-on-surface-variant truncate mt-1">
                  High-res image stored in your on-device encrypted vault.
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
          </div>

          {/* Doctor & Specialty */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                Doctor Name *
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Dr. Full Name"
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                Specialty
              </label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. ENT, Cardiology"
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none"
              />
            </div>
          </div>

          {/* Clinic & Date */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                Clinic / Hospital
              </label>
              <input
                type="text"
                value={clinic}
                onChange={(e) => setClinic(e.target.value)}
                placeholder="Hospital Name"
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                Prescription Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none"
              />
            </div>
          </div>

          {/* Prescribed Medications */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider block">
              Prescribed Medications (comma-separated)
            </label>
            <input
              type="text"
              value={medicineNamesInput}
              onChange={(e) => setMedicineNamesInput(e.target.value)}
              placeholder="e.g. Amoxicillin 500mg, Cetirizine 10mg"
              className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface placeholder:text-outline focus:outline-none"
            />
          </div>

          {/* Diagnosis Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider block">
              Diagnosis & Clinical Notes
            </label>
            <textarea
              rows={2}
              value={diagnosisNotes}
              onChange={(e) => setDiagnosisNotes(e.target.value)}
              placeholder="e.g. Follow-up after blood culture. Take with food."
              className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs font-medium text-on-surface placeholder:text-outline focus:outline-none"
            />
          </div>

          {/* Pharmacy & Refills */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                Dispensing Pharmacy
              </label>
              <input
                type="text"
                value={pharmacy}
                onChange={(e) => setPharmacy(e.target.value)}
                placeholder="CVS, Walgreens..."
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                Refills Remaining
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={refillsRemaining}
                onChange={(e) => setRefillsRemaining(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none"
              />
            </div>
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
            Save Prescription
          </button>
        </div>
      </div>

      {/* Live Camera Modal */}
      {isCameraOpen && (
        <CameraCaptureModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handleCameraCapture}
          title="Capture Prescription Document"
          documentTypeHint="Center the doctor's prescription paper or pharmacy slip"
        />
      )}
    </div>
  );
};
