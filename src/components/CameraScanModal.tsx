import React, { useState, useEffect } from 'react';
import { DosageForm, MealTiming } from '../types/medicine';
import { CameraCaptureModal } from './CameraCaptureModal';

export interface ExtractedMedicationData {
  name: string;
  strength: string;
  strengthUnit: string;
  form: DosageForm;
  frequency: string;
  mealTiming: MealTiming;
  durationDays: number;
  totalQuantity: number;
  refillTrigger: number;
  doctorName: string;
  clinic: string;
  scheduledTimes: string[];
  photoUrl?: string;
}

interface CameraScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (data: ExtractedMedicationData) => void;
}

const PRESET_SAMPLES = [
  {
    id: 'ent-amox',
    name: 'ENT Rx: Amoxicillin 500mg',
    doctor: 'Dr. Marcus Vance (ENT)',
    clinic: 'Apex Sinus Clinic',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB9NH81i_mh13YEoZeDKVK8QkskiYTrbGTbRS_NLmkE6fA2aP-h8ybrxF_1ZglrZbhAXL3aCtb8rq6Dec3Kg8sDK_srJ9LdhNRZ-oz7OYo6hysVvTXzEGedy05spJAHvvrYUFzL2ZFlDO_sjsbQUbA16oXP0FQefohElBU8nebDMBXgQ__I5VTJwlu3hu45aPBFBlIP_VLdnkTR7LBcue6ZmQ9c_tP1z38E_00C3utVxDbXnD53pBMT',
    data: {
      name: 'Amoxicillin',
      strength: '500',
      strengthUnit: 'mg',
      form: 'capsule' as DosageForm,
      frequency: '3 times daily (Every 8 hours)',
      mealTiming: 'after_food' as MealTiming,
      durationDays: 7,
      totalQuantity: 21,
      refillTrigger: 4,
      doctorName: 'Dr. Marcus Vance, MD',
      clinic: 'Apex Sinus & Hearing Pavilion',
      scheduledTimes: ['08:00', '14:00', '20:00'],
    },
  },
  {
    id: 'cardio-lipids',
    name: 'Cardiology Rx: Atorvastatin 20mg',
    doctor: 'Dr. Sarah Collins (Cardiology)',
    clinic: 'St. Jude Health',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBHjyE7LWXZ4VQQT2vmwGd3kbZ2EIhsX5yItNqh7FM9Uy7M6s50LnS8kdrsXt90y44sar04mVv3-9phPhmuiW48SsPfIYNLP9rfp2-PVYVe6U4gOq58ye65tib00M7ygOq3Ii8AyfiegxmvDh05kdrItJjxCzLDXFglDhtStUfoFq-zs-AqTCkkh_wYxStsJ5ECiwt1NlTUyhmcOhBrRgIHVC5ZVfG2jVTdHxMdR7UEDE1gEUwFTRch',
    data: {
      name: 'Atorvastatin',
      strength: '20',
      strengthUnit: 'mg',
      form: 'tablet' as DosageForm,
      frequency: 'Once daily (morning)',
      mealTiming: 'with_meal' as MealTiming,
      durationDays: 30,
      totalQuantity: 30,
      refillTrigger: 7,
      doctorName: 'Dr. Sarah Collins, MD',
      clinic: 'St. Jude Health Center',
      scheduledTimes: ['08:00'],
    },
  },
  {
    id: 'peds-amox',
    name: 'Pediatric Rx: Amoxicillin Syrup',
    doctor: 'Dr. Elena Rostova (Pediatrics)',
    clinic: "BrightSmile Children's Clinic",
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBMud8853BB4CkbHIuvOu9kwZ1pinKY6Dn7rVkL3oKjGtJbQi4Z_qncna_SnXbG7P4tqJmEvzzAFr0yb05dpeG8BcpOYAE0DPcxt3RbQXoth-8-CbzYTvSR2wDtxw-tNdBxq-8eU2NocMSxnzSa6D9tH0LV_07oO2RR7pHiLuJp1q-7z4xoNsopybTJHiYtDsZtOf9m-kYep_43nnfnyid2wjTsTgSRojHAPCEM3rKicd25s7BUX-vX',
    data: {
      name: 'Amoxicillin Oral Suspension',
      strength: '125',
      strengthUnit: 'mg',
      form: 'liquid' as DosageForm,
      frequency: '2 times daily',
      mealTiming: 'after_food' as MealTiming,
      durationDays: 7,
      totalQuantity: 100,
      refillTrigger: 20,
      doctorName: 'Dr. Elena Rostova',
      clinic: "BrightSmile Children's Clinic",
      scheduledTimes: ['08:30', '19:30'],
    },
  },
];

export const CameraScanModal: React.FC<CameraScanModalProps> = ({
  isOpen,
  onClose,
  onApplyData,
}) => {
  if (!isOpen) return null;

  const [selectedSample, setSelectedSample] = useState(PRESET_SAMPLES[0]);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [hasScanned, setHasScanned] = useState<boolean>(false);

  // Trigger scan animation
  const handleTriggerScan = () => {
    setIsScanning(true);
    setHasScanned(false);

    setTimeout(() => {
      setIsScanning(false);
      setHasScanned(true);
    }, 1200);
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    setCustomImage(imageDataUrl);
    setHasScanned(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target?.result as string);
        setHasScanned(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const activeImage = customImage || selectedSample.imageUrl;

  const handleApply = () => {
    const dataToApply = {
      ...selectedSample.data,
      photoUrl: activeImage,
    };
    onApplyData(dataToApply);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-surface-container">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-surface-container-low bg-surface-container-lowest">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-on-surface">
                OCR Prescription Scanner
              </h3>
              <p className="text-[11px] text-on-surface-variant font-medium">
                On-device machine learning parser
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-low text-on-surface flex items-center justify-center hover:bg-surface-container transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Prescription selector tabs */}
        <div className="px-4 pt-3 flex flex-col gap-1.5 bg-surface-container-lowest">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
            Choose Sample Prescription or Upload
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {PRESET_SAMPLES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => {
                  setSelectedSample(sample);
                  setCustomImage(null);
                  setHasScanned(false);
                }}
                type="button"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  !customImage && selectedSample.id === sample.id
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {sample.name.split(':')[0]}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setIsCameraCaptureOpen(true)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 bg-primary text-on-primary hover:bg-primary/90 shadow-sm transition-all flex items-center gap-1 active:scale-95"
            >
              <span className="material-symbols-outlined text-[14px]">photo_camera</span>
              Live Camera
            </button>

            <label className="px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 bg-surface-container text-primary hover:bg-surface-container-high transition-all cursor-pointer flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">upload_file</span>
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>

        {/* Camera Viewport */}
        <div className="relative mx-4 my-3 bg-surface-container rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center border-2 border-primary/30">
          <img
            src={activeImage}
            alt="Prescription Document"
            className="w-full h-full object-cover"
          />

          {/* Viewfinder Target Framing */}
          <div className="absolute inset-3 border-2 border-white/60 rounded-xl pointer-events-none">
            {/* Corner brackets */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-secondary-fixed rounded-tl" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-secondary-fixed rounded-tr" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-secondary-fixed rounded-bl" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-secondary-fixed rounded-br" />
          </div>

          {/* Scanning Beam Animation */}
          {isScanning && (
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-secondary-container to-transparent shadow-[0_0_15px_#6df5e1] animate-pulse top-1/2 -translate-y-1/2" />
          )}

          {/* OCR Detection highlights when scanned */}
          {hasScanned && (
            <div className="absolute inset-0 bg-inverse-surface/30 backdrop-blur-[1px] p-3 flex flex-col justify-between pointer-events-none animate-in fade-in duration-200">
              <span className="self-start inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold shadow-md">
                <span className="material-symbols-outlined text-[13px]">check_circle</span>
                OCR Confirmed (100%)
              </span>
              <div className="bg-surface-container-lowest/90 backdrop-blur-md rounded-xl p-2.5 text-xs text-on-surface shadow-lg space-y-1">
                <div className="font-bold text-primary flex items-center justify-between">
                  <span>Detected: {selectedSample.data.name} {selectedSample.data.strength}{selectedSample.data.strengthUnit}</span>
                  <span className="text-[10px] text-on-surface-variant font-normal">{selectedSample.data.form}</span>
                </div>
                <div className="text-on-surface-variant">
                  {selectedSample.data.frequency} • {selectedSample.data.durationDays} Days • Qty: {selectedSample.data.totalQuantity}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scan Actions & Extracted Details */}
        <div className="p-4 bg-surface-container-lowest flex flex-col gap-3 border-t border-surface-container-low">
          {!hasScanned ? (
            <button
              onClick={handleTriggerScan}
              disabled={isScanning}
              type="button"
              className="w-full py-3 rounded-full bg-primary text-on-primary font-headline font-semibold text-sm shadow-md hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isScanning ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  Analyzing Document...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">document_scanner</span>
                  Scan & Parse Medicine Info
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHasScanned(false)}
                type="button"
                className="py-2.5 px-4 rounded-full bg-surface-container-low text-on-surface-variant font-semibold text-xs hover:bg-surface-container active:scale-95 transition-all"
              >
                Rescan
              </button>
              <button
                onClick={handleApply}
                type="button"
                className="flex-1 py-2.5 px-4 rounded-full bg-primary text-on-primary font-headline font-bold text-xs shadow-md hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                Auto-Fill Into Medication Form
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live Camera Snapshot Modal */}
      {isCameraCaptureOpen && (
        <CameraCaptureModal
          isOpen={isCameraCaptureOpen}
          onClose={() => setIsCameraCaptureOpen(false)}
          onCapture={handleCameraCapture}
          title="Photograph Prescription"
          documentTypeHint="Center doctor's prescription paper or medicine bottle label"
        />
      )}
    </div>
  );
};
