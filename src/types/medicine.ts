export type DosageForm = 'tablet' | 'capsule' | 'liquid' | 'injection' | 'drops' | 'inhaler' | 'syrup' | 'ointment';

export type MealTiming = 'before_food' | 'after_food' | 'with_meal' | 'with_food' | 'anytime';

export type DoseStatus = 'taken' | 'pending' | 'missed' | 'skipped' | 'snoozed';

export type PatientRelation = 'self' | 'parent' | 'child' | 'spouse' | 'other';

export interface PatientProfile {
  id: string;
  name: string;
  shortName: string;
  relation: PatientRelation;
  relationLabel: string;
  avatarUrl?: string;
  initials: string;
  badgeColor?: string;
  isPrimary?: boolean;
  age?: number;
  weightKg?: number;
  hasAlerts?: boolean;
}

export interface Medicine {
  id: string;
  patientId: string;
  name: string;
  genericName?: string;
  condition?: string;
  strength: string;
  strengthUnit: string;
  form: DosageForm;
  frequency: string;
  frequencyIntervalHours?: number;
  scheduledTimes: string[]; // e.g. ['08:00', '14:00', '20:00']
  mealTiming: MealTiming;
  isFixedDuration: boolean;
  startDate: string; // YYYY-MM-DD
  durationDays?: number;
  endDate?: string;
  currentDay?: number; // e.g. Day 5 of 7
  totalQuantity: number;
  remainingQuantity: number;
  consumedQuantity?: number; // total units/pills consumed (supports fractions e.g. 17.5)
  doseAmount?: number; // quantity taken per dose (supports fractions e.g. 0.5 for half pill, 1, 1.5)
  refillTrigger: number;
  expiryDate?: string;
  prescriptionId?: string;
  photoUrl?: string;
  doctorName?: string;
  status: 'active' | 'completed' | 'discontinued';
  adherenceRate: number; // percentage
  colorAccent?: string;
  instructions?: string;
  stopReminderEnabled?: boolean;
  stopReminderDaysNotice?: number; // e.g. 1 or 2 days before stopping
}

export interface HealthVitalLog {
  id: string;
  patientId: string;
  type: 'blood_sugar' | 'blood_pressure';
  date: string;
  time: string;
  sugarValue?: number; // mg/dL
  sugarContext?: 'fasting' | 'post_prandial' | 'random' | 'before_bed';
  systolic?: number; // mmHg
  diastolic?: number; // mmHg
  pulse?: number; // bpm
  notes?: string;
}

export interface DoseItem {
  id: string;
  medicineId: string;
  patientId: string;
  medicineName: string;
  strength: string;
  form: DosageForm;
  amount?: number; // scheduled amount (e.g. 1 or 0.5)
  consumedAmount?: number; // actual amount consumed when taken (e.g. 0.5, 1, 1.5)
  mealTiming: MealTiming;
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'night';
  scheduledTime: string; // e.g. '8:00 AM'
  status: DoseStatus;
  takenAt?: string;
  dayProgress?: string; // e.g. 'Day 5 of 7'
  instructions?: string;
  isHero?: boolean;
}

export interface PrescriptionRecord {
  id: string;
  patientId: string;
  doctorName: string;
  specialty: string;
  clinic: string;
  date: string;
  photoUrl: string;
  pages?: string[]; // Array of multiple page data URLs or images
  linkedMedicineIds: string[];
  linkedMedicineNames: string[];
  diagnosisNotes?: string;
  pharmacy?: string;
  refillsRemaining?: number;
  ocrVerified: boolean;
  category: 'prescriptions' | 'labs' | 'visits';
  confidenceScore?: number;
  pediatricNote?: string;
  patientWeight?: string;
  tags?: string[];
  autoExtractedMedicines?: {
    name: string;
    strength?: string;
    form?: DosageForm;
    frequency?: string;
    mealTiming?: MealTiming;
    durationDays?: number;
    instructions?: string;
  }[];
}

export interface TestReport {
  id: string;
  patientId: string;
  title: string;
  reportType: 'blood' | 'radiology' | 'cardio' | 'pathology' | 'general' | 'urine' | 'mri_ct';
  facility: string;
  date: string;
  doctorName?: string;
  fileUrl?: string;
  pages?: string[]; // Array of multiple page data URLs or images
  summary: string;
  flag: 'normal' | 'attention' | 'critical';
  metrics?: { name: string; value: string; unit?: string; referenceRange?: string; status?: 'normal' | 'high' | 'low' }[];
}

export interface DoctorVisit {
  id: string;
  patientId: string;
  doctorName: string;
  clinic: string;
  date: string;
  reason: string;
  summary: string;
  nextFollowUp?: string;
}

export interface NotificationSettings {
  morningTime: string;
  afternoonTime: string;
  eveningTime: string;
  nightTime: string;
  refillThresholdDays: number;
  expiryWarningDays: number;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
}
