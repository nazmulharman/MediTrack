import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  googleSignOut,
  getAccessToken,
  backupToGoogleDrive,
  listDriveBackups,
  downloadDriveBackup,
  deleteDriveBackup,
  DriveFileMetadata,
  MediTrackDataPayload,
} from '../services/googleDriveService';
import {
  PatientProfile,
  Medicine,
  DoseItem,
  PrescriptionRecord,
  TestReport,
  DoctorVisit,
  NotificationSettings,
  HealthVitalLog,
} from '../types/medicine';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
  // Current app state to backup
  appData: {
    profiles: PatientProfile[];
    medicines: Medicine[];
    doses: DoseItem[];
    prescriptions: PrescriptionRecord[];
    testReports: TestReport[];
    visits: DoctorVisit[];
    vitals: HealthVitalLog[];
    settings: NotificationSettings;
  };
  // Callback when user restores data
  onRestoreData: (restoredData: MediTrackDataPayload) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  appData,
  onRestoreData,
}) => {
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [backups, setBackups] = useState<DriveFileMetadata[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Destructive Confirmation States (MANDATORY per Workspace guidelines)
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<DriveFileMetadata | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [confirmRestoreFile, setConfirmRestoreFile] = useState<DriveFileMetadata | null>(null);
  const [restoringFileData, setRestoringFileData] = useState<MediTrackDataPayload | null>(null);
  const [isLoadingRestorePreview, setIsLoadingRestorePreview] = useState(false);

  // Check token and fetch backups whenever modal opens or user changes
  useEffect(() => {
    if (isOpen) {
      checkTokenAndLoadBackups();
    }
  }, [isOpen, currentUser]);

  const checkTokenAndLoadBackups = async () => {
    const token = await getAccessToken();
    setHasToken(!!token);
    if (token) {
      loadBackups();
    }
  };

  const loadBackups = async () => {
    setIsLoadingBackups(true);
    setStatusMessage(null);
    try {
      const files = await listDriveBackups();
      setBackups(files);
    } catch (err: any) {
      console.error('Error fetching Drive backups:', err);
      // If unauthorized, token expired or needs re-auth
      if (err?.message?.includes('401') || err?.message?.includes('Authentication')) {
        setHasToken(false);
      }
      setStatusMessage({
        text: err?.message || 'Could not load backups from Google Drive.',
        type: 'error',
      });
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoadingAuth(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        onUserChange(res.user);
        setHasToken(true);
        setStatusMessage({
          text: `Signed in as ${res.user.displayName || res.user.email}. Connected to Google Drive.`,
          type: 'success',
        });
        loadBackups();
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setStatusMessage({
        text: err?.message || 'Failed to sign in with Google.',
        type: 'error',
      });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
      onUserChange(null);
      setHasToken(false);
      setBackups([]);
      setStatusMessage({
        text: 'Successfully signed out from Google Account.',
        type: 'info',
      });
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    setStatusMessage(null);
    try {
      const payload: MediTrackDataPayload = {
        version: '2.4.0',
        appName: 'MediTrack',
        exportedAt: new Date().toISOString(),
        profiles: appData.profiles,
        medicines: appData.medicines,
        doses: appData.doses,
        prescriptions: appData.prescriptions,
        testReports: appData.testReports,
        visits: appData.visits,
        vitals: appData.vitals,
        settings: appData.settings,
      };

      const dateStr = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const timeStr = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const customFileName = `meditrack_backup_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.json`;

      const uploaded = await backupToGoogleDrive(payload, customFileName);
      setStatusMessage({
        text: `✓ Successfully saved to Google Drive: "${uploaded.name}" (${dateStr}, ${timeStr})`,
        type: 'success',
      });
      loadBackups();
    } catch (err: any) {
      console.error('Backup error:', err);
      setStatusMessage({
        text: err?.message || 'Failed to backup data to Google Drive.',
        type: 'error',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // Preparation for Restore: Download data first to preview in confirmation modal
  const handleInitiateRestore = async (file: DriveFileMetadata) => {
    setIsLoadingRestorePreview(true);
    setStatusMessage(null);
    try {
      const data = await downloadDriveBackup(file.id);
      setRestoringFileData(data);
      setConfirmRestoreFile(file);
    } catch (err: any) {
      console.error('Restore fetch error:', err);
      setStatusMessage({
        text: err?.message || 'Failed to inspect backup file.',
        type: 'error',
      });
    } finally {
      setIsLoadingRestorePreview(false);
    }
  };

  // User confirms restore
  const handleConfirmRestore = () => {
    if (!restoringFileData) return;
    onRestoreData(restoringFileData);
    setStatusMessage({
      text: `✓ Restored ${restoringFileData.medicines.length} medicines, ${restoringFileData.profiles.length} profiles, and ${restoringFileData.doses.length} dosage logs from Google Drive backup.`,
      type: 'success',
    });
    setConfirmRestoreFile(null);
    setRestoringFileData(null);
  };

  // User confirms delete
  const handleConfirmDelete = async () => {
    if (!confirmDeleteFile) return;
    setIsDeleting(true);
    try {
      await deleteDriveBackup(confirmDeleteFile.id);
      setStatusMessage({
        text: `✓ Deleted backup "${confirmDeleteFile.name}" from Google Drive.`,
        type: 'info',
      });
      setConfirmDeleteFile(null);
      loadBackups();
    } catch (err: any) {
      console.error('Delete error:', err);
      setStatusMessage({
        text: err?.message || 'Failed to delete backup from Google Drive.',
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytesStr?: string) => {
    if (!bytesStr) return 'JSON doc';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return 'JSON doc';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-t-[32px] sm:rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-surface-container overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-surface-container flex items-center justify-between bg-surface-container-low/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-surface-container-high flex items-center justify-center shadow-xs border border-surface-container">
              {/* Official Google Drive icon SVG */}
              <svg className="w-6 h-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline font-bold text-base text-on-surface">
                  Google Drive Cloud Vault
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed/60 text-on-primary-fixed-variant text-[10px] font-bold">
                  Workspace Sync
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Store, backup & sync medicine records with Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
            type="button"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[calc(92vh-130px)]">
          {/* Status Toast Alert */}
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-150 ${
                statusMessage.type === 'success'
                  ? 'bg-secondary-fixed/50 text-on-secondary-fixed-variant border border-secondary/30'
                  : statusMessage.type === 'error'
                  ? 'bg-error-container text-on-error-container border border-error/30'
                  : 'bg-surface-container text-on-surface-variant border border-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                {statusMessage.type === 'success'
                  ? 'check_circle'
                  : statusMessage.type === 'error'
                  ? 'error'
                  : 'info'}
              </span>
              <div className="flex-1 leading-relaxed">{statusMessage.text}</div>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-on-surface-variant/70 hover:text-on-surface"
                type="button"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          )}

          {/* User Sign-In Box */}
          {currentUser && hasToken ? (
            <div className="p-4 rounded-3xl bg-surface-container-low border border-surface-container space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Google User'}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-sm flex items-center justify-center">
                      {(currentUser.displayName || currentUser.email || 'G').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-headline font-bold text-xs text-on-surface">
                        {currentUser.displayName || 'Google Account'}
                      </h4>
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-primary text-on-primary text-[9px] font-bold">
                        <span className="material-symbols-outlined text-[10px]">check</span>
                        Connected
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant">{currentUser.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-3 py-1 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold transition-colors"
                >
                  Sign Out
                </button>
              </div>

              {/* Quick Actions Bar */}
              <div className="pt-2 border-t border-surface-container flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateBackup}
                  disabled={isBackingUp}
                  className="flex-1 py-2.5 px-3 rounded-2xl bg-primary text-on-primary font-bold text-xs shadow-sm hover:bg-primary-container active:scale-98 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isBackingUp ? 'hourglass_top' : 'cloud_upload'}
                  </span>
                  {isBackingUp ? 'Saving to Drive...' : 'Backup Current Data Now'}
                </button>

                <button
                  type="button"
                  onClick={loadBackups}
                  disabled={isLoadingBackups}
                  title="Refresh Drive backups"
                  className="w-10 h-10 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-primary transition-colors disabled:opacity-60"
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      isLoadingBackups ? 'animate-spin' : ''
                    }`}
                  >
                    refresh
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-3xl bg-surface-container-low border border-surface-container text-center space-y-3.5">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-high mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[28px]">cloud_sync</span>
              </div>
              <div className="max-w-xs mx-auto">
                <h4 className="font-headline font-bold text-sm text-on-surface">
                  Sign in with Google
                </h4>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Log in to securely store your medicine schedules, dosages, and vault records in your personal Google Drive with permission.
                </p>
              </div>

              {/* Official Sign in with Google Button Styled as requested */}
              <div className="flex justify-center pt-1">
                <button
                  onClick={handleSignIn}
                  disabled={isLoadingAuth}
                  type="button"
                  className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white text-gray-700 font-semibold text-xs border border-gray-300 shadow-sm hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-60"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      className="w-4 h-4"
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                  </div>
                  <span>{isLoadingAuth ? 'Connecting to Google...' : 'Sign in with Google'}</span>
                </button>
              </div>

              <p className="text-[10px] text-outline">
                Uses Google Drive File scope to store your app data securely.
              </p>
            </div>
          )}

          {/* Current Workspace Summary */}
          <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-headline font-bold text-xs text-on-surface">
                Current App State Ready to Sync
              </span>
              <span className="text-[11px] text-primary font-bold">
                {appData.medicines.length} Medicines
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-surface-container-low">
                <span className="font-bold text-primary block">{appData.profiles.length}</span>
                <span className="text-[10px] text-on-surface-variant">Profiles</span>
              </div>
              <div className="p-2 rounded-xl bg-surface-container-low">
                <span className="font-bold text-primary block">{appData.medicines.length}</span>
                <span className="text-[10px] text-on-surface-variant">Meds</span>
              </div>
              <div className="p-2 rounded-xl bg-surface-container-low">
                <span className="font-bold text-primary block">{appData.prescriptions.length}</span>
                <span className="text-[10px] text-on-surface-variant">Prescriptions</span>
              </div>
              <div className="p-2 rounded-xl bg-surface-container-low">
                <span className="font-bold text-primary block">{appData.doses.length}</span>
                <span className="text-[10px] text-on-surface-variant">Logs</span>
              </div>
            </div>
          </div>

          {/* Google Drive Saved Backups List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">folder</span>
                <h4 className="font-headline font-bold text-xs text-on-surface">
                  Google Drive Cloud Backups
                </h4>
              </div>
              {hasToken && (
                <span className="text-[11px] text-outline font-semibold">
                  {backups.length} file{backups.length !== 1 ? 's' : ''} found
                </span>
              )}
            </div>

            {!hasToken ? (
              <div className="p-4 rounded-2xl bg-surface-container-low text-center text-xs text-on-surface-variant border border-dashed border-surface-container">
                Connect your Google Account above to view and restore your stored backups from Google Drive.
              </div>
            ) : isLoadingBackups ? (
              <div className="p-6 rounded-2xl bg-surface-container-low text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-primary animate-spin text-[20px]">
                  progress_activity
                </span>
                <span>Accessing your Google Drive files...</span>
              </div>
            ) : backups.length === 0 ? (
              <div className="p-5 rounded-2xl bg-surface-container-low text-center space-y-2 border border-dashed border-surface-container">
                <span className="material-symbols-outlined text-outline text-[28px]">cloud_off</span>
                <p className="text-xs text-on-surface-variant">
                  No previous MediTrack backups detected in your Google Drive.
                </p>
                <button
                  type="button"
                  onClick={handleCreateBackup}
                  disabled={isBackingUp}
                  className="px-4 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary-container"
                >
                  Create First Backup Now
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {backups.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-2xl bg-surface-container-low border border-surface-container hover:bg-surface-container/80 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">description</span>
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-headline font-bold text-xs text-on-surface truncate">
                          {b.name}
                        </h5>
                        <p className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                          <span>{formatDate(b.modifiedTime)}</span>
                          <span>•</span>
                          <span>{formatFileSize(b.size)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Restore Button */}
                      <button
                        type="button"
                        onClick={() => handleInitiateRestore(b)}
                        disabled={isLoadingRestorePreview}
                        title="Restore this backup"
                        className="px-2.5 py-1 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">restore</span>
                        Restore
                      </button>

                      {/* View in Drive (External) */}
                      {b.webViewLink && (
                        <a
                          href={b.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open file in Google Drive"
                          className="w-7 h-7 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant flex items-center justify-center transition-colors"
                        >
                          <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                        </a>
                      )}

                      {/* Delete File (Destructive - Opens Confirmation Dialog) */}
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteFile(b)}
                        title="Delete backup from Google Drive"
                        className="w-7 h-7 rounded-xl bg-error-container/40 hover:bg-error-container text-error flex items-center justify-center transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-surface-container bg-surface-container-low/40 flex items-center justify-between text-xs text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-primary">verified_user</span>
            Google OAuth 2.0 Protected
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest font-semibold text-on-surface transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* MANDATORY Confirmation Dialog: Delete File from Google Drive */}
      {confirmDeleteFile && (
        <div className="fixed inset-0 z-60 bg-inverse-surface/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-error/20 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-error-container/50 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">delete_forever</span>
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-headline font-bold text-base text-on-surface">
                Delete Google Drive Backup?
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-on-surface">"{confirmDeleteFile.name}"</strong> from your Google Drive? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDeleteFile(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-2xl bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-2xl bg-error text-on-error text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isDeleting ? 'hourglass_top' : 'delete'}
                </span>
                {isDeleting ? 'Deleting...' : 'Delete File'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY Confirmation Dialog: Restore File from Google Drive (Mutates local workspace) */}
      {confirmRestoreFile && restoringFileData && (
        <div className="fixed inset-0 z-60 bg-inverse-surface/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-5 shadow-2xl border border-primary/20 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">cloud_download</span>
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-headline font-bold text-base text-on-surface">
                Restore MediTrack Data from Google Drive?
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                You are about to load backup <strong className="text-on-surface">"{confirmRestoreFile.name}"</strong> into your workspace.
              </p>
            </div>

            {/* Content Preview */}
            <div className="p-3 rounded-2xl bg-surface-container-low text-xs space-y-1.5 border border-surface-container">
              <span className="font-bold text-[11px] text-on-surface-variant uppercase tracking-wider block">
                Backup Content Overview:
              </span>
              <div className="grid grid-cols-2 gap-2 text-on-surface font-semibold text-[11px]">
                <div>• {restoringFileData.medicines?.length || 0} Medicine Courses</div>
                <div>• {restoringFileData.profiles?.length || 0} Patient Profiles</div>
                <div>• {restoringFileData.prescriptions?.length || 0} Prescriptions</div>
                <div>• {restoringFileData.doses?.length || 0} Dosage Logs</div>
              </div>
              <p className="text-[10px] text-outline pt-1">
                Notice: Restoring will update your active workspace records with this Google Drive snapshot.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setConfirmRestoreFile(null);
                  setRestoringFileData(null);
                }}
                className="flex-1 py-2.5 rounded-2xl bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="flex-1 py-2.5 rounded-2xl bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">restore</span>
                Confirm & Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
