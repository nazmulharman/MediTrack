import { PatientProfile, Medicine, DoseItem, PrescriptionRecord, TestReport, DoctorVisit, NotificationSettings, HealthVitalLog } from '../types/medicine';

export const INITIAL_PROFILES: PatientProfile[] = [
  {
    id: 'primary-user',
    name: 'My Profile',
    shortName: 'Me',
    relation: 'self',
    relationLabel: 'Primary',
    initials: 'ME',
    badgeColor: 'bg-primary text-on-primary',
    isPrimary: true,
  }
];

export const INITIAL_MEDICINES: Medicine[] = [];

export const INITIAL_DOSES: DoseItem[] = [];

export const INITIAL_PRESCRIPTIONS: PrescriptionRecord[] = [];

export const INITIAL_TEST_REPORTS: TestReport[] = [];

export const INITIAL_VISITS: DoctorVisit[] = [];

export const INITIAL_SETTINGS: NotificationSettings = {
  morningTime: '08:00',
  afternoonTime: '13:30',
  eveningTime: '19:00',
  nightTime: '22:00',
  refillThresholdDays: 3,
  expiryWarningDays: 14,
  soundEnabled: true,
  vibrateEnabled: true
};

export const INITIAL_VITALS: HealthVitalLog[] = [];
