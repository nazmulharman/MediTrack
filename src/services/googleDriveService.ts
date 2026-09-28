import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
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

export interface MediTrackDataPayload {
  version: string;
  appName: string;
  exportedAt: string;
  profiles: PatientProfile[];
  medicines: Medicine[];
  doses: DoseItem[];
  prescriptions: PrescriptionRecord[];
  testReports: TestReport[];
  visits: DoctorVisit[];
  vitals: HealthVitalLog[];
  settings: NotificationSettings;
}

export interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  createdTime?: string;
  size?: string;
  webViewLink?: string;
}

// Scopes required for Google Drive app files and profile info
export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// Initialize Firebase App instance safely without duplicates
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
let cachedAccessToken: string | null = null;

/**
 * Initialize auth listener with in-memory token state
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  try {
    if (!auth) {
      if (onAuthFailure) onAuthFailure();
      return () => {};
    }
    return onAuthStateChanged(auth, async (user: User | null) => {
      try {
        if (user) {
          if (cachedAccessToken) {
            if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
          } else if (!isSigningIn) {
            // Token isn't cached yet (e.g. reload), prompt user to re-authenticate or keep user info
            if (onAuthSuccess) onAuthSuccess(user, null);
          }
        } else {
          cachedAccessToken = null;
          if (onAuthFailure) onAuthFailure();
        }
      } catch (err) {
        console.warn('Auth state handler error:', err);
      }
    });
  } catch (err) {
    console.warn('initAuth error:', err);
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
};

/**
 * Interactive Google Sign-In with popup
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not retrieve access token from Google sign in.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current in-memory access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Sign out from Google & clear token cache
 */
export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Upload medication records & vault state to Google Drive as a structured JSON backup
 */
export const backupToGoogleDrive = async (
  payload: MediTrackDataPayload,
  customFileName?: string
): Promise<DriveFileMetadata> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in with Google to access Google Drive.');
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = customFileName || `meditrack_cloud_vault_${timestamp}.json`;

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: `MediTrack Medical Vault Backup (${payload.profiles.length} profiles, ${payload.medicines.length} medicines, ${payload.doses.length} logs)`,
  };

  const fileContent = JSON.stringify(payload, null, 2);
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive backup failed: ${response.status} ${errorText}`);
  }

  return (await response.json()) as DriveFileMetadata;
};

/**
 * List MediTrack backups stored on user's Google Drive
 */
export const listDriveBackups = async (): Promise<DriveFileMetadata[]> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in with Google.');
  }

  const query = encodeURIComponent("name contains 'meditrack' and trashed = false");
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,modifiedTime,createdTime,size,webViewLink)&orderBy=modifiedTime desc&pageSize=25`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list Google Drive files: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return (data.files || []) as DriveFileMetadata[];
};

/**
 * Download a backup file from Google Drive
 */
export const downloadDriveBackup = async (fileId: string): Promise<MediTrackDataPayload> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in with Google.');
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to download backup from Google Drive: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.medicines) || !Array.isArray(data.profiles)) {
    throw new Error('The selected file does not appear to be a valid MediTrack backup format.');
  }

  return data as MediTrackDataPayload;
};

/**
 * Delete a backup file from Google Drive (DESTRUCTIVE OPERATION)
 * Must only be called after explicit user confirmation in UI.
 */
export const deleteDriveBackup = async (fileId: string): Promise<void> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in with Google.');
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const errorText = await response.text();
    throw new Error(`Failed to delete Google Drive file: ${response.status} ${errorText}`);
  }
};
