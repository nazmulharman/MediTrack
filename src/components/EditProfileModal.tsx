import React, { useState, useEffect, useRef } from 'react';
import { PatientProfile, PatientRelation } from '../types/medicine';
import { CameraCaptureModal } from './CameraCaptureModal';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PatientProfile | null; // null for new profile
  onSaveProfile: (profile: PatientProfile) => void;
  onDeleteProfile?: (profileId: string) => void;
  isOnlyProfile?: boolean;
}

const PRESET_BADGE_COLORS = [
  { label: 'Teal', class: 'bg-primary text-on-primary', hex: '#00685f' },
  { label: 'Indigo', class: 'bg-indigo-600 text-white', hex: '#4f46e5' },
  { label: 'Rose', class: 'bg-rose-600 text-white', hex: '#e11d48' },
  { label: 'Amber', class: 'bg-amber-600 text-white', hex: '#d97706' },
  { label: 'Emerald', class: 'bg-emerald-600 text-white', hex: '#059669' },
  { label: 'Purple', class: 'bg-purple-600 text-white', hex: '#9333ea' },
  { label: 'Sky', class: 'bg-sky-600 text-white', hex: '#0284c7' },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onDeleteProfile,
  isOnlyProfile = false,
}) => {
  if (!isOpen) return null;

  const isEditMode = !!profile;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states
  const [name, setName] = useState<string>(profile?.name || '');
  const [shortName, setShortName] = useState<string>(profile?.shortName || '');
  const [relation, setRelation] = useState<PatientRelation>(profile?.relation || 'child');
  const [age, setAge] = useState<string>(profile?.age !== undefined ? String(profile.age) : '');
  const [weightKg, setWeightKg] = useState<string>(profile?.weightKg !== undefined ? String(profile.weightKg) : '');
  const [avatarUrl, setAvatarUrl] = useState<string>(profile?.avatarUrl || '');
  const [badgeColor, setBadgeColor] = useState<string>(profile?.badgeColor || 'bg-primary text-on-primary');
  const [isPrimary, setIsPrimary] = useState<boolean>(profile?.isPrimary || false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Camera modal state
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);

  // Auto-fill shortName from name if user hasn't typed a custom short name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!shortName || shortName === name.split(' ')[0]) {
      setShortName(val.split(' ')[0] || '');
    }
  };

  // Compute initials
  const initials = (name.trim() || 'ME')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  // File Upload Handler (Image from device gallery/disk)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image size exceeds 5MB. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target?.result as string);
        setErrorMsg('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    setAvatarUrl(imageDataUrl);
    setIsCameraOpen(false);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setErrorMsg('Please enter a profile name');
      return;
    }

    const relationLabels: Record<PatientRelation, string> = {
      self: 'Primary',
      parent: 'Parent',
      child: 'Child',
      spouse: 'Partner',
      other: 'Family',
    };

    const parsedAge = age.trim() !== '' ? parseInt(age.trim(), 10) : undefined;
    const parsedWeight = weightKg.trim() !== '' ? parseFloat(weightKg.trim()) : undefined;

    const savedProfile: PatientProfile = {
      id: profile?.id || `p-${Date.now()}`,
      name: name.trim(),
      shortName: shortName.trim() || name.trim().split(' ')[0],
      relation,
      relationLabel: relationLabels[relation],
      avatarUrl: avatarUrl.trim() || undefined,
      initials,
      badgeColor,
      isPrimary,
      age: !isNaN(parsedAge as number) ? parsedAge : undefined,
      weightKg: !isNaN(parsedWeight as number) ? parsedWeight : undefined,
      hasAlerts: profile?.hasAlerts || false,
    };

    onSaveProfile(savedProfile);
    onClose();
  };

  const handleDelete = () => {
    if (!profile || !onDeleteProfile) return;
    if (confirm(`Are you sure you want to delete "${profile.name}"? This profile's active view will be removed.`)) {
      onDeleteProfile(profile.id);
      onClose();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-inverse-surface/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-surface-container flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 bg-surface-container-low flex items-center justify-between border-b border-surface-container shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[22px]">
                  {isEditMode ? 'manage_accounts' : 'person_add'}
                </span>
              </div>
              <div>
                <h3 className="font-headline font-bold text-base text-on-surface">
                  {isEditMode ? 'Edit Care Profile' : 'Add Family Member'}
                </h3>
                <p className="text-xs text-on-surface-variant font-medium">
                  {isEditMode ? 'Update avatar, age & details' : 'Track medications for family or dependents'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Form Content */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Profile Picture / Avatar Section */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container flex flex-col items-center text-center space-y-3">
              <div className="relative group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name || 'Profile Avatar'}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/20 shadow-md"
                  />
                ) : (
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold ring-4 ring-primary/20 shadow-md ${badgeColor}`}
                  >
                    {initials}
                  </div>
                )}

                {/* Edit overlay icon */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload profile image"
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all border-2 border-surface-container-lowest"
                >
                  <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                </button>
              </div>

              <div>
                <p className="text-xs font-bold text-on-surface">Profile Photo & Color</p>
                <p className="text-[11px] text-on-surface-variant">
                  Add an image or pick a color badge for easy identification
                </p>
              </div>

              {/* Photo Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-semibold transition-all border border-surface-container"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">upload</span>
                  <span>Upload Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-semibold transition-all border border-surface-container"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">photo_camera</span>
                  <span>Take Photo</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-error-container/40 text-error text-xs font-semibold hover:bg-error-container/70 transition-all"
                  >
                    <span className="material-symbols-outlined text-[15px]">delete</span>
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {/* Preset Color Swatches for initials */}
              <div className="pt-1 flex items-center gap-1.5 justify-center">
                <span className="text-[10px] font-bold text-outline uppercase mr-1">Badge:</span>
                {PRESET_BADGE_COLORS.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setBadgeColor(c.class)}
                    className={`w-6 h-6 rounded-full transition-transform ${c.class.split(' ')[0]} ${
                      badgeColor === c.class ? 'scale-125 ring-2 ring-primary ring-offset-2' : 'hover:scale-110'
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Name and Nickname Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Full Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Sarah Connor or Dad (Robert)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 border border-surface-container"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Short Display Name
                  </label>
                  <input
                    type="text"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    placeholder="e.g. Sarah"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 border border-surface-container"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Relationship
                  </label>
                  <select
                    value={relation}
                    onChange={(e) => setRelation(e.target.value as PatientRelation)}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 border border-surface-container"
                  >
                    <option value="self">Self (Primary)</option>
                    <option value="child">Child / Dependent</option>
                    <option value="parent">Parent</option>
                    <option value="spouse">Spouse / Partner</option>
                    <option value="other">Other / Relative</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Age & Body Weight Row */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary">cake</span>
                  <span>Age (Years)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="125"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 34"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 border border-surface-container"
                />
                <span className="text-[10px] text-outline mt-0.5 block">
                  For pediatric & age checks
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-secondary">scale</span>
                  <span>Weight (kg)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="e.g. 14.2"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 border border-surface-container"
                />
                <span className="text-[10px] text-outline mt-0.5 block">
                  Key for liquid dosing
                </span>
              </div>
            </div>

            {/* Primary Profile Switch */}
            <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-on-surface block">Primary Care Account</span>
                <span className="text-[11px] text-on-surface-variant">
                  Default profile loaded upon opening MediTrack
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPrimary(!isPrimary)}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                  isPrimary ? 'bg-primary' : 'bg-surface-container-high'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    isPrimary ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Delete profile option (Only if editing and not the sole profile) */}
            {isEditMode && !isOnlyProfile && onDeleteProfile && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full py-2.5 px-3 rounded-xl bg-error-container/30 hover:bg-error-container/50 text-error text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span>Delete Profile</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-surface-container-low border-t border-surface-container flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-md hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              <span>{isEditMode ? 'Save Changes' : 'Create Profile'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Camera Capture Sub-Modal */}
      {isCameraOpen && (
        <CameraCaptureModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handleCameraCapture}
          title="Take Profile Photo"
          documentTypeHint="Center face within frame for your care avatar"
        />
      )}
    </>
  );
};
