import React, { useState, useRef } from 'react';
import { PrescriptionRecord, DosageForm, MealTiming } from '../types/medicine';
import { CameraCaptureModal } from './CameraCaptureModal';
import { ImageCropModal } from './ImageCropModal';
import { extractPrescriptionInfo, ExtractedPrescriptionMedicine } from '../services/prescriptionOcrService';

interface AddPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePatientId: string;
  onSavePrescription: (prescription: PrescriptionRecord) => void;
}

const DEFAULT_SAMPLE_RX =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB9NH81i_mh13YEoZeDKVK8QkskiYTrbGTbRS_NLmkE6fA2aP-h8ybrxF_1ZglrZbhAXL3aCtb8rq6Dec3Kg8sDK_srJ9LdhNRZ-oz7OYo6hysVvTXzEGedy05spJAHvvrYUFzL2ZFlDO_sjsbQUbA16oXP0FQefohElBU8nebDMBXgQ__I5VTJwlu3hu45aPBFBlIP_VLdnkTR7LBcue6ZmQ9c_tP1z38E_00C3utVxDbXnD53pBMT';

export const AddPrescriptionModal: React.FC<AddPrescriptionModalProps> = ({
  isOpen,
  onClose,
  activePatientId,
  onSavePrescription,
}) => {
  if (!isOpen) return null;

  // Multi-page document state
  const [pages, setPages] = useState<string[]>([DEFAULT_SAMPLE_RX]);
  const [hasCustomPhoto, setHasCustomPhoto] = useState<boolean>(false);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);

  // Camera & Cropper state
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

  // AI Extraction State
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractConfidence, setExtractConfidence] = useState<number | null>(null);
  const [extractSuccessMessage, setExtractSuccessMessage] = useState<string>('');

  // Editable Form Fields (Auto-collected or Manually inputted)
  const [doctorName, setDoctorName] = useState<string>('Dr. Marcus Vance, MD');
  const [specialty, setSpecialty] = useState<string>('Otolaryngology (ENT)');
  const [clinic, setClinic] = useState<string>('Apex Sinus & Hearing Pavilion');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [diagnosisNotes, setDiagnosisNotes] = useState<string>(
    'Acute bacterial maxillary sinusitis with congestion & pressure.'
  );
  const [pharmacy, setPharmacy] = useState<string>('Apex Health Pavilion Pharmacy');
  const [refillsRemaining, setRefillsRemaining] = useState<number>(1);

  // Prescribed Medicines list (Auto-collected or manually managed)
  const [medicinesList, setMedicinesList] = useState<ExtractedPrescriptionMedicine[]>([
    {
      name: 'Amoxicillin-Potassium Clavulanate',
      strength: '875-125 mg',
      form: 'tablet',
      frequency: 'Twice daily with meals (Every 12 hrs)',
      mealTiming: 'with_food',
      durationDays: 10,
      instructions: 'Complete full 10-day course. Take at start of meal.',
    },
  ]);

  const [activeTab, setActiveTab] = useState<'details' | 'pages'>('pages');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add a new page from file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('Image size exceeds 10MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImgUrl = event.target?.result as string;
        if (!hasCustomPhoto) {
          // Replace sample
          setPages([newImgUrl]);
          setHasCustomPhoto(true);
          setSelectedPageIndex(0);
          // Open cropper immediately for precision
          setCropTarget({ isOpen: true, pageIndex: 0, imageUrl: newImgUrl });
        } else {
          // Append new page
          const nextIndex = pages.length;
          setPages((prev) => [...prev, newImgUrl]);
          setSelectedPageIndex(nextIndex);
          setCropTarget({ isOpen: true, pageIndex: nextIndex, imageUrl: newImgUrl });
        }
        setErrorMsg('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Add a new page from camera capture
  const handleCameraCapture = (imageDataUrl: string) => {
    setIsCameraOpen(false);
    if (!hasCustomPhoto) {
      // Replace sample with first custom page
      setPages([imageDataUrl]);
      setHasCustomPhoto(true);
      setSelectedPageIndex(0);
      setCropTarget({ isOpen: true, pageIndex: 0, imageUrl: imageDataUrl });
    } else {
      // Append additional page
      const nextIndex = pages.length;
      setPages((prev) => [...prev, imageDataUrl]);
      setSelectedPageIndex(nextIndex);
      setCropTarget({ isOpen: true, pageIndex: nextIndex, imageUrl: imageDataUrl });
    }
  };

  // Handle crop completion for a specific page
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

  // Remove a page
  const handleRemovePage = (indexToRemove: number) => {
    if (pages.length <= 1) {
      setErrorMsg('Prescription must have at least 1 document page.');
      return;
    }
    const newPages = pages.filter((_, i) => i !== indexToRemove);
    setPages(newPages);
    if (selectedPageIndex >= newPages.length) {
      setSelectedPageIndex(newPages.length - 1);
    }
  };

  // Move page order
  const handleMovePage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;
    const newPages = [...pages];
    const temp = newPages[index];
    newPages[index] = newPages[targetIndex];
    newPages[targetIndex] = temp;
    setPages(newPages);
    setSelectedPageIndex(targetIndex);
  };

  // Auto-collect info from prescription using AI / OCR
  const handleAutoCollect = async () => {
    setIsExtracting(true);
    setErrorMsg('');
    setExtractSuccessMessage('');
    try {
      const result = await extractPrescriptionInfo(pages);
      setDoctorName(result.doctorName);
      setSpecialty(result.specialty);
      setClinic(result.clinic);
      setDate(result.date || new Date().toISOString().split('T')[0]);
      if (result.diagnosisNotes) setDiagnosisNotes(result.diagnosisNotes);
      if (result.pharmacy) setPharmacy(result.pharmacy);
      if (result.refillsRemaining !== undefined) setRefillsRemaining(result.refillsRemaining);
      if (result.medicines && result.medicines.length > 0) {
        setMedicinesList(result.medicines);
      }
      setExtractConfidence(result.confidenceScore);
      setExtractSuccessMessage(
        `Auto-collected ${result.medicines.length} medicine(s) & doctor info (${result.confidenceScore}% confidence). You can adjust any field manually below.`
      );
      setActiveTab('details');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not auto-extract prescription info. Please enter manually.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Medicine management
  const handleAddMedicine = () => {
    setMedicinesList((prev) => [
      ...prev,
      {
        name: '',
        strength: '',
        form: 'tablet',
        frequency: 'Once daily',
        mealTiming: 'after_food',
        durationDays: 7,
        instructions: '',
      },
    ]);
  };

  const handleUpdateMedicine = (index: number, field: keyof ExtractedPrescriptionMedicine, val: any) => {
    setMedicinesList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicinesList((prev) => prev.filter((_, i) => i !== index));
  };

  // Save Prescription Record
  const handleSave = () => {
    if (!doctorName.trim()) {
      setErrorMsg('Please enter the doctor name (or auto-collect)');
      return;
    }
    setErrorMsg('');

    // Extract names for fast linking
    const medNames = medicinesList
      .map((m) => `${m.name} ${m.strength || ''}`.trim())
      .filter((n) => n.length > 0);

    const newPrescription: PrescriptionRecord = {
      id: `rx-${Date.now()}`,
      patientId: activePatientId,
      doctorName: doctorName.trim(),
      specialty: specialty.trim() || 'General Medicine',
      clinic: clinic.trim() || 'Medical Clinic',
      date,
      photoUrl: pages[0] || DEFAULT_SAMPLE_RX,
      pages, // Stores all multiple pages!
      linkedMedicineIds: [],
      linkedMedicineNames: medNames.length > 0 ? medNames : ['Prescribed Medication'],
      diagnosisNotes: diagnosisNotes.trim() || undefined,
      pharmacy: pharmacy.trim() || undefined,
      refillsRemaining,
      ocrVerified: true,
      category: 'prescriptions',
      confidenceScore: extractConfidence || 95,
      autoExtractedMedicines: medicinesList,
    };

    onSavePrescription(newPrescription);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-inverse-surface/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[94vh] border border-surface-container">
          {/* Header */}
          <div className="p-4 bg-surface-container-low flex items-center justify-between border-b border-surface-container shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[22px]">prescriptions</span>
              </div>
              <div>
                <h3 className="font-headline font-bold text-base text-on-surface">
                  Attach Doctor Prescription
                </h3>
                <p className="text-[11px] text-on-surface-variant font-medium">
                  Add multiple pages, crop documents & auto-collect information
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

          {/* Tab Switcher: Pages vs Prescription Details */}
          <div className="px-4 pt-2.5 pb-1 bg-surface-container-lowest border-b border-surface-container flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-container-low">
              <button
                type="button"
                onClick={() => setActiveTab('pages')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'pages'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">file_copy</span>
                <span>Document Pages ({pages.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'details'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">edit_note</span>
                <span>Rx Info & Medicines ({medicinesList.length})</span>
              </button>
            </div>

            {/* AI Auto-Collect Trigger Button */}
            <button
              type="button"
              onClick={handleAutoCollect}
              disabled={isExtracting}
              className="px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-2xs border border-secondary/20 disabled:opacity-50"
              title="Automatically extract doctor name, clinic and prescribed medicines from pages"
            >
              <span
                className={`material-symbols-outlined text-[15px] ${
                  isExtracting ? 'animate-spin' : 'text-primary'
                }`}
              >
                {isExtracting ? 'sync' : 'auto_awesome'}
              </span>
              <span>{isExtracting ? 'Extracting...' : 'Auto-Collect'}</span>
            </button>
          </div>

          {/* Form Content */}
          <div className="p-4 overflow-y-auto space-y-4 flex-1">
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {extractSuccessMessage && (
              <div className="p-3 rounded-2xl bg-primary-container/40 text-on-primary-container text-xs font-semibold flex items-center gap-2 animate-in fade-in border border-primary/20">
                <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                <span>{extractSuccessMessage}</span>
              </div>
            )}

            {/* TAB 1: DOCUMENT PAGES & CROP */}
            {activeTab === 'pages' && (
              <div className="space-y-4">
                {/* Multi-Page Header & Add Buttons */}
                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[17px]">
                          collections_bookmark
                        </span>
                        <span>Prescription Pages ({pages.length})</span>
                      </h4>
                      <p className="text-[11px] text-on-surface-variant">
                        Add front & back or multiple pages. Crop each page to remove borders.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsCameraOpen(true)}
                        className="px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90 flex items-center gap-1 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                        <span>Take Photo</span>
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

                  {/* Horizontal Strip of Pages */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    {pages.map((imgUrl, idx) => {
                      const isSelected = selectedPageIndex === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedPageIndex(idx)}
                          className={`relative rounded-2xl p-2 flex flex-col gap-2 transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-secondary-fixed/20 border-primary ring-2 ring-primary/30 shadow-xs'
                              : 'bg-surface-container-lowest border-surface-container hover:border-primary/40'
                          }`}
                        >
                          {/* Page Thumbnail with aspect ratio container */}
                          <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-black/5 flex items-center justify-center">
                            <img
                              src={imgUrl}
                              alt={`Prescription Page ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {/* Page Badge */}
                            <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold">
                              Page {idx + 1}
                            </span>
                          </div>

                          {/* Page Actions: Crop, Move, Delete */}
                          <div className="flex items-center justify-between gap-1 pt-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCropTarget({ isOpen: true, pageIndex: idx, imageUrl: imgUrl });
                              }}
                              className="px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-on-primary text-[11px] font-bold flex items-center gap-1 transition-colors"
                              title="Crop and align this page"
                            >
                              <span className="material-symbols-outlined text-[13px]">crop</span>
                              <span>Crop</span>
                            </button>

                            <div className="flex items-center gap-0.5">
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMovePage(idx, 'left');
                                  }}
                                  title="Move earlier"
                                  className="w-6 h-6 rounded-md hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
                                >
                                  <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                                </button>
                              )}
                              {idx < pages.length - 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMovePage(idx, 'right');
                                  }}
                                  title="Move later"
                                  className="w-6 h-6 rounded-md hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
                                >
                                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                </button>
                              )}
                              {pages.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemovePage(idx);
                                  }}
                                  title="Delete page"
                                  className="w-6 h-6 rounded-md hover:bg-error-container/40 flex items-center justify-center text-outline hover:text-error"
                                >
                                  <span className="material-symbols-outlined text-[14px]">delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* "+ Add Another Page" placeholder card */}
                    <div
                      onClick={() => setIsCameraOpen(true)}
                      className="border-2 border-dashed border-primary/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:bg-surface-container-high/40 transition-colors aspect-[3/4]"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                      </div>
                      <span className="text-xs font-bold text-primary block">+ Add Page</span>
                      <span className="text-[10px] text-outline">Camera or Gallery</span>
                    </div>
                  </div>
                </div>

                {/* Selected Page Full Preview & Instant Crop Banner */}
                {pages[selectedPageIndex] && (
                  <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-on-surface">
                        Viewing Page {selectedPageIndex + 1} of {pages.length}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCropTarget({
                            isOpen: true,
                            pageIndex: selectedPageIndex,
                            imageUrl: pages[selectedPageIndex],
                          })
                        }
                        className="px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90 flex items-center gap-1 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-[15px]">crop</span>
                        <span>Crop / Rotate Page {selectedPageIndex + 1}</span>
                      </button>
                    </div>

                    <div className="rounded-xl overflow-hidden bg-black/5 max-h-64 flex items-center justify-center border border-surface-container">
                      <img
                        src={pages[selectedPageIndex]}
                        alt={`Page ${selectedPageIndex + 1}`}
                        className="max-h-64 w-auto object-contain rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PRESCRIPTION DETAILS & AUTO / MANUAL MEDICATIONS */}
            {activeTab === 'details' && (
              <div className="space-y-4">
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
                      placeholder="e.g. Dr. Marcus Vance, MD"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-surface-container"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                      Medical Specialty
                    </label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="e.g. ENT, Cardiology, Pediatrics"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-surface-container"
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
                      placeholder="e.g. Apex Sinus Pavilion"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-surface-container"
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-surface-container"
                    />
                  </div>
                </div>

                {/* Prescribed Medications: Auto-Collected or Manually Inputted */}
                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[18px]">
                          medication
                        </span>
                        <span>Prescribed Medications ({medicinesList.length})</span>
                      </h4>
                      <p className="text-[11px] text-on-surface-variant">
                        Review auto-collected medicines or edit/add manually
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      className="px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[15px]">add</span>
                      <span>Add Medicine</span>
                    </button>
                  </div>

                  {/* List of Medicine Cards */}
                  <div className="space-y-2.5">
                    {medicinesList.map((med, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                            <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <span>Medicine Item #{idx + 1}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveMedicine(idx)}
                            className="text-outline hover:text-error text-xs flex items-center gap-0.5"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                            <span className="text-[11px]">Remove</span>
                          </button>
                        </div>

                        {/* Name and Strength */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-outline uppercase block">
                              Medicine Name *
                            </label>
                            <input
                              type="text"
                              value={med.name}
                              onChange={(e) => handleUpdateMedicine(idx, 'name', e.target.value)}
                              placeholder="e.g. Amoxicillin"
                              className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-outline uppercase block">
                              Strength
                            </label>
                            <input
                              type="text"
                              value={med.strength || ''}
                              onChange={(e) => handleUpdateMedicine(idx, 'strength', e.target.value)}
                              placeholder="e.g. 500 mg"
                              className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Form & Frequency */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-outline uppercase block">
                              Dosage Form
                            </label>
                            <select
                              value={med.form || 'tablet'}
                              onChange={(e) =>
                                handleUpdateMedicine(idx, 'form', e.target.value as DosageForm)
                              }
                              className="w-full px-2.5 py-2 rounded-lg bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none"
                            >
                              <option value="tablet">Tablet</option>
                              <option value="capsule">Capsule</option>
                              <option value="syrup">Liquid / Syrup</option>
                              <option value="drops">Drops / Spray</option>
                              <option value="injection">Injection</option>
                              <option value="inhaler">Inhaler</option>
                              <option value="ointment">Cream / Ointment</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-outline uppercase block">
                              Frequency / Timing
                            </label>
                            <input
                              type="text"
                              value={med.frequency || ''}
                              onChange={(e) => handleUpdateMedicine(idx, 'frequency', e.target.value)}
                              placeholder="e.g. Twice daily with meals"
                              className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Instructions */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-outline uppercase block">
                            Instructions
                          </label>
                          <input
                            type="text"
                            value={med.instructions || ''}
                            onChange={(e) =>
                              handleUpdateMedicine(idx, 'instructions', e.target.value)
                            }
                            placeholder="e.g. Complete full course; drink plenty of water"
                            className="w-full px-3 py-1.5 rounded-lg bg-surface-container-low text-xs font-medium text-on-surface focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
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
                    placeholder="e.g. Clinical notes, lab findings, or special dietary conditions"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-xs font-medium text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40 border border-surface-container"
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
                      placeholder="e.g. CVS, Walgreens..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-surface-container"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                      Refills Allowed
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      value={refillsRemaining}
                      onChange={(e) => setRefillsRemaining(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 border border-surface-container"
                    />
                  </div>
                </div>
              </div>
            )}
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

            <div className="flex items-center gap-2">
              {activeTab === 'pages' ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className="px-4 py-2.5 rounded-full bg-surface-container-high hover:bg-surface-container text-on-surface font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Review Details</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('pages')}
                  className="px-4 py-2.5 rounded-full bg-surface-container-high hover:bg-surface-container text-on-surface font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>View Pages</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>Save Prescription</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Camera Modal */}
      {isCameraOpen && (
        <CameraCaptureModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handleCameraCapture}
          title="Capture Prescription Document"
          documentTypeHint="Center the prescription paper or pharmacy slip"
        />
      )}

      {/* Interactive Image Cropper Modal */}
      {cropTarget.isOpen && cropTarget.imageUrl && (
        <ImageCropModal
          isOpen={cropTarget.isOpen}
          onClose={() => setCropTarget({ isOpen: false, pageIndex: 0, imageUrl: '' })}
          imageUrl={cropTarget.imageUrl}
          onCropComplete={handleCropComplete}
          title={`Crop Prescription Page ${cropTarget.pageIndex + 1}`}
          initialAspectRatio="document"
        />
      )}
    </>
  );
};
