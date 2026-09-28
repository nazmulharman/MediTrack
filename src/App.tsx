import React, { useState, useEffect } from 'react';
import {
  INITIAL_PROFILES,
  INITIAL_MEDICINES,
  INITIAL_DOSES,
  INITIAL_PRESCRIPTIONS,
  INITIAL_TEST_REPORTS,
  INITIAL_VISITS,
  INITIAL_SETTINGS,
  INITIAL_VITALS,
} from './data/initialData';
import {
  PatientProfile,
  Medicine,
  DoseItem,
  PrescriptionRecord,
  TestReport,
  DoctorVisit,
  NotificationSettings,
  HealthVitalLog,
} from './types/medicine';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { TodayTab } from './components/TodayTab';
import { MedicinesTab } from './components/MedicinesTab';
import { VaultTab } from './components/VaultTab';
import { HistoryTab } from './components/HistoryTab';
import { SettingsTab } from './components/SettingsTab';
import { AddMedicineModal } from './components/AddMedicineModal';
import { CameraScanModal, ExtractedMedicationData } from './components/CameraScanModal';
import { RefillModal } from './components/RefillModal';
import { ZoomInspectModal } from './components/ZoomInspectModal';
import { MedicineDetailModal } from './components/MedicineDetailModal';
import { ExportSummaryModal } from './components/ExportSummaryModal';
import { ExportCalendarModal } from './components/ExportCalendarModal';
import { NotificationBanner } from './components/NotificationBanner';
import { AddReportModal } from './components/AddReportModal';
import { AddPrescriptionModal } from './components/AddPrescriptionModal';
import { VitalsModal } from './components/VitalsModal';
import { SmartLogoModal } from './components/SmartLogoModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { CourseRenewalModal } from './components/CourseRenewalModal';
import { useNotificationScheduler } from './hooks/useNotificationScheduler';
import { notificationService, ActiveCourseAlert } from './services/notificationService';
import { roundFraction, formatFraction } from './utils/fractionUtils';
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  MediTrackDataPayload,
} from './services/googleDriveService';
import { User } from 'firebase/auth';

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<TabType>('today');

  // Core Data with localStorage persistence (checks meditrack_* then legacy dosekeeper_*)
  const [profiles, setProfiles] = useState<PatientProfile[]>(() => {
    const saved = localStorage.getItem('meditrack_profiles') || localStorage.getItem('dosekeeper_profiles');
    return saved ? JSON.parse(saved) : INITIAL_PROFILES;
  });

  const [activeProfile, setActiveProfile] = useState<PatientProfile>(() => {
    return profiles[0] || INITIAL_PROFILES[0];
  });

  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    const saved = localStorage.getItem('meditrack_medicines') || localStorage.getItem('dosekeeper_medicines');
    return saved ? JSON.parse(saved) : INITIAL_MEDICINES;
  });

  const [doses, setDoses] = useState<DoseItem[]>(() => {
    const saved = localStorage.getItem('meditrack_doses') || localStorage.getItem('dosekeeper_doses');
    return saved ? JSON.parse(saved) : INITIAL_DOSES;
  });

  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>(() => {
    const saved = localStorage.getItem('meditrack_prescriptions') || localStorage.getItem('dosekeeper_prescriptions');
    return saved ? JSON.parse(saved) : INITIAL_PRESCRIPTIONS;
  });

  const [testReports, setTestReports] = useState<TestReport[]>(() => {
    const saved = localStorage.getItem('meditrack_reports') || localStorage.getItem('dosekeeper_reports');
    return saved ? JSON.parse(saved) : INITIAL_TEST_REPORTS;
  });

  const [visits, setVisits] = useState<DoctorVisit[]>(() => {
    const saved = localStorage.getItem('meditrack_visits') || localStorage.getItem('dosekeeper_visits');
    return saved ? JSON.parse(saved) : INITIAL_VISITS;
  });

  const [vitals, setVitals] = useState<HealthVitalLog[]>(() => {
    const saved = localStorage.getItem('meditrack_vitals') || localStorage.getItem('dosekeeper_vitals');
    return saved ? JSON.parse(saved) : INITIAL_VITALS;
  });

  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('meditrack_settings') || localStorage.getItem('dosekeeper_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  // Modals state
  const [isAddMedicineOpen, setIsAddMedicineOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [isAddReportOpen, setIsAddReportOpen] = useState(false);
  const [isAddPrescriptionOpen, setIsAddPrescriptionOpen] = useState(false);
  const [isVitalsOpen, setIsVitalsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [prefilledData, setPrefilledData] = useState<ExtractedMedicationData | null>(null);

  const [selectedMedForRefill, setSelectedMedForRefill] = useState<Medicine | null>(null);
  const [selectedMedForDetail, setSelectedMedForDetail] = useState<Medicine | null>(null);

  const [zoomModalData, setZoomModalData] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    imageUrl: string;
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    imageUrl: '',
  });

  const [isExportPDFOpen, setIsExportPDFOpen] = useState(false);
  const [isExportCalendarOpen, setIsExportCalendarOpen] = useState(false);
  const [exportCalendarMedId, setExportCalendarMedId] = useState<string | undefined>(undefined);
  const [isSmartLogoOpen, setIsSmartLogoOpen] = useState(false);
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isGoogleDriveOpen, setIsGoogleDriveOpen] = useState(false);
  const [courseRenewalState, setCourseRenewalState] = useState<{
    isOpen: boolean;
    medicine: Medicine | null;
    alertData: ActiveCourseAlert | null;
    initialMode: 'contact' | 'renew';
  }>({
    isOpen: false,
    medicine: null,
    alertData: null,
    initialMode: 'contact',
  });

  // Initialize Firebase Auth listener for Google Account
  useEffect(() => {
    const unsub = initAuth(
      (user) => setGoogleUser(user),
      () => setGoogleUser(null)
    );
    return () => {
      if (typeof unsub === 'function') {
        unsub();
      }
    };
  }, []);

  const handleOpenExportCalendar = (medId?: string) => {
    setExportCalendarMedId(medId);
    setIsExportCalendarOpen(true);
  };

  const handleRenewCourse = (
    medicineId: string,
    additionalDays: number,
    additionalQuantity: number,
    note?: string
  ) => {
    setMedicines((prev) =>
      prev.map((med) => {
        if (med.id === medicineId) {
          const newDuration = (med.durationDays || 7) + additionalDays;
          const newRemaining = (med.remainingQuantity || 0) + additionalQuantity;
          const newTotal = (med.totalQuantity || 0) + additionalQuantity;
          return {
            ...med,
            durationDays: newDuration,
            remainingQuantity: newRemaining,
            totalQuantity: newTotal,
            status: 'active',
          };
        }
        return med;
      })
    );

    const targetMed = medicines.find((m) => m.id === medicineId);
    const medName = targetMed?.name || 'Medicine';

    setGalleryToast({
      message: `Course Renewed: ${medName}`,
      subMessage: `Extended by +${additionalDays} days (+${additionalQuantity} units added to stock).`,
      show: true,
    });
  };

  const handleRestoreData = (payload: MediTrackDataPayload) => {
    if (payload.profiles && Array.isArray(payload.profiles) && payload.profiles.length > 0) {
      setProfiles(payload.profiles);
      setActiveProfile(payload.profiles[0]);
    }
    if (payload.medicines && Array.isArray(payload.medicines)) {
      setMedicines(payload.medicines);
    }
    if (payload.doses && Array.isArray(payload.doses)) {
      setDoses(payload.doses);
    }
    if (payload.prescriptions && Array.isArray(payload.prescriptions)) {
      setPrescriptions(payload.prescriptions);
    }
    if (payload.testReports && Array.isArray(payload.testReports)) {
      setTestReports(payload.testReports);
    }
    if (payload.visits && Array.isArray(payload.visits)) {
      setVisits(payload.visits);
    }
    if (payload.vitals && Array.isArray(payload.vitals)) {
      setVitals(payload.vitals);
    }
    if (payload.settings) {
      setSettings(payload.settings);
    }
    setGalleryToast({
      message: 'Cloud Vault Restored Successfully',
      subMessage: `Loaded ${payload.medicines?.length || 0} medicines and ${payload.profiles?.length || 0} profiles from Google Drive.`,
      show: true,
    });
  };

  // Gallery and Vault view mode state
  const [vaultViewMode, setVaultViewMode] = useState<'gallery' | 'list'>('gallery');
  const [vaultCategory, setVaultCategory] = useState<
    'all' | 'prescriptions' | 'labs' | 'vitals' | 'visits' | 'gallery'
  >('all');
  const [highlightDocId, setHighlightDocId] = useState<string | null>(null);
  const [galleryToast, setGalleryToast] = useState<{
    message: string;
    subMessage?: string;
    show: boolean;
  } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('meditrack_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('meditrack_medicines', JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    localStorage.setItem('meditrack_doses', JSON.stringify(doses));
  }, [doses]);

  useEffect(() => {
    localStorage.setItem('meditrack_prescriptions', JSON.stringify(prescriptions));
  }, [prescriptions]);

  useEffect(() => {
    localStorage.setItem('meditrack_reports', JSON.stringify(testReports));
  }, [testReports]);

  useEffect(() => {
    localStorage.setItem('meditrack_visits', JSON.stringify(visits));
  }, [visits]);

  useEffect(() => {
    localStorage.setItem('meditrack_vitals', JSON.stringify(vitals));
  }, [vitals]);

  useEffect(() => {
    localStorage.setItem('meditrack_settings', JSON.stringify(settings));
  }, [settings]);

  // Check course stop reminders once on mount
  useEffect(() => {
    medicines.forEach((med) => {
      if (
        med.status === 'active' &&
        med.isFixedDuration &&
        med.durationDays &&
        (med.currentDay || 1) >= med.durationDays
      ) {
        notificationService.triggerCourseStopReminder(
          med.name,
          med.durationDays,
          med.doctorName
        );
      }
    });
  }, []);

  // Handlers
  const handleUpdateDoseStatus = (
    doseId: string,
    newStatus: 'taken' | 'pending' | 'skipped' | 'snoozed',
    customAmount?: number
  ) => {
    setDoses((prev) =>
      prev.map((d) => {
        if (d.id === doseId) {
          const targetMed = medicines.find((m) => m.id === d.medicineId);
          const doseUnit = customAmount !== undefined ? customAmount : (d.amount || targetMed?.doseAmount || 1);

          // If moving to taken, deduct remaining medicine stock by fractional doseUnit and track consumed
          if (newStatus === 'taken' && d.status !== 'taken') {
            setMedicines((mList) =>
              mList.map((med) => {
                if (med.id === d.medicineId) {
                  const currentConsumed = med.consumedQuantity !== undefined
                    ? med.consumedQuantity
                    : Math.max(0, roundFraction(med.totalQuantity - med.remainingQuantity));
                  return {
                    ...med,
                    remainingQuantity: Math.max(0, roundFraction(med.remainingQuantity - doseUnit)),
                    consumedQuantity: roundFraction(currentConsumed + doseUnit),
                  };
                }
                return med;
              })
            );
          } else if (newStatus === 'pending' && d.status === 'taken') {
            // Undo: refund exact consumed amount
            const refundUnit = d.consumedAmount || doseUnit;
            setMedicines((mList) =>
              mList.map((med) => {
                if (med.id === d.medicineId) {
                  const currentConsumed = med.consumedQuantity !== undefined
                    ? med.consumedQuantity
                    : Math.max(0, roundFraction(med.totalQuantity - med.remainingQuantity));
                  return {
                    ...med,
                    remainingQuantity: roundFraction(med.remainingQuantity + refundUnit),
                    consumedQuantity: Math.max(0, roundFraction(currentConsumed - refundUnit)),
                  };
                }
                return med;
              })
            );
          }

          return {
            ...d,
            status: newStatus,
            consumedAmount: newStatus === 'taken' ? doseUnit : undefined,
            takenAt:
              newStatus === 'taken'
                ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : undefined,
          };
        }
        return d;
      })
    );
  };

  const handleSaveMedicine = (savedMed: Medicine) => {
    const isExisting = medicines.some((m) => m.id === savedMed.id);

    if (isExisting) {
      // Update existing medicine in list
      setMedicines((prev) =>
        prev.map((m) => (m.id === savedMed.id ? savedMed : m))
      );

      // Update associated doses with updated medicine details & fraction instructions
      setDoses((prev) =>
        prev.map((d) => {
          if (d.medicineId === savedMed.id) {
            return {
              ...d,
              medicineName: savedMed.name,
              strength: `${savedMed.strength}${savedMed.strengthUnit}`,
              form: savedMed.form,
              amount: savedMed.doseAmount || 1,
              mealTiming: savedMed.mealTiming,
              instructions: `${formatFraction(savedMed.doseAmount || 1)} ${savedMed.form} • ${savedMed.mealTiming.replace('_', ' ')}`,
            };
          }
          return d;
        })
      );
    } else {
      // Insert new medicine
      setMedicines((prev) => [savedMed, ...prev]);

      // Create doses for today
      const newDoses: DoseItem[] = savedMed.scheduledTimes.map((time, idx) => {
        let timeSlot: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
        const hour = parseInt(time.split(':')[0], 10) || 8;
        if (hour < 12) timeSlot = 'morning';
        else if (hour < 17) timeSlot = 'afternoon';
        else if (hour < 21) timeSlot = 'evening';
        else timeSlot = 'night';

        return {
          id: `dose-${Date.now()}-${idx}`,
          medicineId: savedMed.id,
          patientId: savedMed.patientId,
          medicineName: savedMed.name,
          strength: `${savedMed.strength}${savedMed.strengthUnit}`,
          form: savedMed.form,
          amount: savedMed.doseAmount || 1,
          mealTiming: savedMed.mealTiming,
          timeSlot,
          scheduledTime: time,
          status: 'pending',
          instructions: `${formatFraction(savedMed.doseAmount || 1)} ${savedMed.form} • ${savedMed.mealTiming.replace('_', ' ')}`,
        };
      });

      setDoses((prev) => [...prev, ...newDoses]);
    }

    setPrefilledData(null);
    setEditingMedicine(null);
  };

  const handleUpdateConsumed = (medId: string, newConsumed: number) => {
    const safeConsumed = Math.max(0, roundFraction(newConsumed));
    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id === medId) {
          const safeRemaining = Math.max(0, roundFraction(m.totalQuantity - safeConsumed));
          return {
            ...m,
            consumedQuantity: safeConsumed,
            remainingQuantity: safeRemaining,
          };
        }
        return m;
      })
    );
  };

  const handleSaveReport = (newReport: TestReport) => {
    setTestReports((prev) => [newReport, ...prev]);
    setCurrentTab('vault');
    setVaultViewMode('gallery');
    setVaultCategory('all');
    setHighlightDocId(newReport.id);
    setGalleryToast({
      message: `Report "${newReport.title}" Stored!`,
      subMessage: 'Showing all reports & prescriptions in your gallery',
      show: true,
    });
    setTimeout(() => {
      setGalleryToast(null);
    }, 4500);
  };

  const handleSavePrescription = (newPrescription: PrescriptionRecord) => {
    setPrescriptions((prev) => [newPrescription, ...prev]);
    setCurrentTab('vault');
    setVaultViewMode('gallery');
    setVaultCategory('all');
    setHighlightDocId(newPrescription.id);
    setGalleryToast({
      message: `Prescription from ${newPrescription.doctorName} Attached!`,
      subMessage: 'Showing all reports & prescriptions in your gallery',
      show: true,
    });
    setTimeout(() => {
      setGalleryToast(null);
    }, 4500);
  };

  const handleDeleteReport = (reportId: string) => {
    setTestReports((prev) => prev.filter((r) => r.id !== reportId));
  };

  const handleDeletePrescription = (rxId: string) => {
    setPrescriptions((prev) => prev.filter((p) => p.id !== rxId));
  };

  const handleSaveVital = (newVital: HealthVitalLog) => {
    setVitals((prev) => [newVital, ...prev]);
  };

  const handleRefillConfirm = (medId: string, addedCount: number) => {
    setMedicines((prev) =>
      prev.map((m) => {
        if (m.id === medId) {
          return {
            ...m,
            remainingQuantity: m.remainingQuantity + addedCount,
            totalQuantity: m.totalQuantity + addedCount,
          };
        }
        return m;
      })
    );
  };

  const handleToggleMedicineStatus = (
    medId: string,
    newStatus: 'active' | 'completed' | 'discontinued'
  ) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === medId ? { ...m, status: newStatus } : m))
    );
  };

  const handleDiscontinueCourse = (medId: string) => {
    handleToggleMedicineStatus(medId, 'completed');
  };

  const handleApplyScannedData = (data: ExtractedMedicationData) => {
    setPrefilledData(data);
    setIsAddMedicineOpen(true);
  };

  const handleResetData = () => {
    localStorage.clear();
    setProfiles(INITIAL_PROFILES);
    setActiveProfile(INITIAL_PROFILES[0]);
    setMedicines(INITIAL_MEDICINES);
    setDoses(INITIAL_DOSES);
    setPrescriptions(INITIAL_PRESCRIPTIONS);
    setTestReports(INITIAL_TEST_REPORTS);
    setVisits(INITIAL_VISITS);
    setVitals(INITIAL_VITALS);
    setSettings(INITIAL_SETTINGS);
  };

  const handleExportJSON = () => {
    const backup = {
      profiles,
      medicines,
      doses,
      prescriptions,
      testReports,
      visits,
      vitals,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meditrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter doses for active profile
  const currentProfileDoses = doses.filter(
    (d) => d.patientId === activeProfile.id || (!d.patientId && activeProfile.id === 'sarah')
  );

  const hasLowStockAlert = medicines.some(
    (m) => m.status === 'active' && m.remainingQuantity <= m.refillTrigger
  );

  // Web Notification Scheduler Hook (monitors scheduled doses and course completion alerts)
  const { testTrigger, testCourseTrigger } = useNotificationScheduler(
    doses,
    (doseId, action) => {
      handleUpdateDoseStatus(doseId, action);
    },
    medicines
  );

  const handleTestNotification = (targetDose?: DoseItem) => {
    const doseToTest =
      targetDose ||
      doses.find((d) => d.status === 'pending') ||
      doses[0];
    if (doseToTest) {
      testTrigger(doseToTest);
    }
  };

  const handleTestCourseNotification = () => {
    testCourseTrigger();
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col antialiased text-on-surface">
      {/* Top Application Bar */}
      <Header
        currentTab={currentTab}
        activeProfile={activeProfile}
        onOpenProfiles={() => setCurrentTab('settings')}
        onOpenSmartLogo={() => setIsSmartLogoOpen(true)}
        onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
        googleUser={googleUser}
      />

      {/* Actionable Web Notification Banner with Taken and Skip & Course Completion */}
      <NotificationBanner
        onDoseAction={(doseId, action) => {
          handleUpdateDoseStatus(doseId, action);
        }}
        onContactDoctor={(alert) => {
          const med = medicines.find((m) => m.id === alert.medicineId) || null;
          setCourseRenewalState({
            isOpen: true,
            medicine: med,
            alertData: alert,
            initialMode: 'contact',
          });
        }}
        onRequestRenewal={(alert) => {
          const med = medicines.find((m) => m.id === alert.medicineId) || null;
          setCourseRenewalState({
            isOpen: true,
            medicine: med,
            alertData: alert,
            initialMode: 'renew',
          });
        }}
      />

      {/* Gallery Flash Confirmation Toast */}
      {galleryToast?.show && (
        <aside
          aria-live="polite"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] bg-primary text-on-primary p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-white/20 animate-in fade-in slide-in-from-top-4"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[19px]">photo_library</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold font-headline truncate">{galleryToast.message}</p>
              {galleryToast.subMessage && (
                <p className="text-[11px] opacity-90 truncate">{galleryToast.subMessage}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setGalleryToast(null)}
            type="button"
            className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors shrink-0"
            aria-label="Dismiss toast"
          >
            <span className="material-symbols-outlined text-[17px]">close</span>
          </button>
        </aside>
      )}

      {/* Main Screen Content Viewport */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-18 bg-surface">
        {currentTab === 'today' && (
          <TodayTab
            profiles={profiles}
            activeProfile={activeProfile}
            onSelectProfile={setActiveProfile}
            onOpenProfilesModal={() => setCurrentTab('settings')}
            doses={currentProfileDoses}
            medicines={medicines}
            vitals={vitals}
            onUpdateDoseStatus={handleUpdateDoseStatus}
            onOpenAddMedicine={() => {
              setEditingMedicine(null);
              setIsAddMedicineOpen(true);
            }}
            onEditMedicine={(med) => {
              setEditingMedicine(med);
              setIsAddMedicineOpen(true);
            }}
            onUpdateConsumed={handleUpdateConsumed}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenRefill={(med) => setSelectedMedForRefill(med)}
            onSelectMedicine={(med) => setSelectedMedForDetail(med)}
            onOpenVitals={() => setIsVitalsOpen(true)}
            onDiscontinueCourse={handleDiscontinueCourse}
            onTestNotification={handleTestNotification}
            onOpenExportCalendar={() => handleOpenExportCalendar()}
            onContactDoctor={(med) => {
              setCourseRenewalState({
                isOpen: true,
                medicine: med,
                alertData: null,
                initialMode: 'contact',
              });
            }}
            onRequestRenewal={(med) => {
              setCourseRenewalState({
                isOpen: true,
                medicine: med,
                alertData: null,
                initialMode: 'renew',
              });
            }}
          />
        )}

        {currentTab === 'medicines' && (
          <MedicinesTab
            medicines={medicines}
            onSelectMedicine={(med) => setSelectedMedForDetail(med)}
            onOpenAddMedicine={() => {
              setEditingMedicine(null);
              setIsAddMedicineOpen(true);
            }}
            onEditMedicine={(med) => {
              setEditingMedicine(med);
              setIsAddMedicineOpen(true);
            }}
            onOpenRefill={(med) => setSelectedMedForRefill(med)}
            onOpenExportCalendar={(medId) => handleOpenExportCalendar(medId)}
            onContactDoctor={(med) => {
              setCourseRenewalState({
                isOpen: true,
                medicine: med,
                alertData: null,
                initialMode: 'contact',
              });
            }}
            onRequestRenewal={(med) => {
              setCourseRenewalState({
                isOpen: true,
                medicine: med,
                alertData: null,
                initialMode: 'renew',
              });
            }}
          />
        )}

        {currentTab === 'vault' && (
          <VaultTab
            prescriptions={prescriptions}
            testReports={testReports}
            visits={visits}
            profiles={profiles}
            vitals={vitals}
            onOpenZoom={(title, subtitle, imageUrl) =>
              setZoomModalData({ isOpen: true, title, subtitle, imageUrl })
            }
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenAddReport={() => setIsAddReportOpen(true)}
            onOpenAddPrescription={() => setIsAddPrescriptionOpen(true)}
            onOpenVitals={() => setIsVitalsOpen(true)}
            onExportPDF={() => setIsExportPDFOpen(true)}
            onExportCalendar={() => handleOpenExportCalendar()}
            onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
            onDeleteReport={handleDeleteReport}
            onDeletePrescription={handleDeletePrescription}
            initialViewMode={vaultViewMode}
            initialCategory={vaultCategory}
            highlightDocId={highlightDocId}
            onClearHighlight={() => setHighlightDocId(null)}
          />
        )}

        {currentTab === 'history' && (
          <HistoryTab
            medicines={medicines}
            doses={doses}
            activeProfile={activeProfile}
            onExportPDF={() => setIsExportPDFOpen(true)}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsTab
            profiles={profiles}
            activeProfile={activeProfile}
            onSelectProfile={setActiveProfile}
            onAddProfile={(newP) => setProfiles((prev) => [...prev, newP])}
            settings={settings}
            onUpdateSettings={setSettings}
            onResetData={handleResetData}
            onExportData={handleExportJSON}
            onExportCalendar={() => handleOpenExportCalendar()}
            onTestNotification={() => handleTestNotification()}
            onTestCourseNotification={handleTestCourseNotification}
            onOpenSmartLogo={() => setIsSmartLogoOpen(true)}
            onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
            googleUser={googleUser}
            onGoogleSignIn={async () => {
              try {
                const res = await googleSignIn();
                if (res) setGoogleUser(res.user);
              } catch (err) {
                console.error(err);
              }
            }}
            onGoogleSignOut={async () => {
              try {
                await googleSignOut();
                setGoogleUser(null);
              } catch (err) {
                console.error(err);
              }
            }}
          />
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        hasRefillAlert={hasLowStockAlert}
      />

      {/* Modals & Dialogs */}
      <GoogleDriveModal
        isOpen={isGoogleDriveOpen}
        onClose={() => setIsGoogleDriveOpen(false)}
        currentUser={googleUser}
        onUserChange={setGoogleUser}
        appData={{
          profiles,
          medicines,
          doses,
          prescriptions,
          testReports,
          visits,
          vitals,
          settings,
        }}
        onRestoreData={handleRestoreData}
      />
      {isSmartLogoOpen && (
        <SmartLogoModal
          isOpen={isSmartLogoOpen}
          onClose={() => setIsSmartLogoOpen(false)}
        />
      )}
      {isAddMedicineOpen && (
        <AddMedicineModal
          isOpen={isAddMedicineOpen}
          onClose={() => {
            setIsAddMedicineOpen(false);
            setEditingMedicine(null);
            setPrefilledData(null);
          }}
          editMedicine={editingMedicine}
          onSaveMedicine={handleSaveMedicine}
          onOpenScanner={() => {
            setIsAddMedicineOpen(false);
            setIsScannerOpen(true);
          }}
          prefilledData={prefilledData}
          activePatientId={activeProfile.id}
        />
      )}

      {isAddReportOpen && (
        <AddReportModal
          isOpen={isAddReportOpen}
          onClose={() => setIsAddReportOpen(false)}
          activePatientId={activeProfile.id}
          onSaveReport={handleSaveReport}
        />
      )}

      {isAddPrescriptionOpen && (
        <AddPrescriptionModal
          isOpen={isAddPrescriptionOpen}
          onClose={() => setIsAddPrescriptionOpen(false)}
          activePatientId={activeProfile.id}
          onSavePrescription={handleSavePrescription}
        />
      )}

      {isVitalsOpen && (
        <VitalsModal
          isOpen={isVitalsOpen}
          onClose={() => setIsVitalsOpen(false)}
          activePatientId={activeProfile.id}
          onSaveVital={handleSaveVital}
        />
      )}

      {isScannerOpen && (
        <CameraScanModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onApplyData={handleApplyScannedData}
        />
      )}

      {selectedMedForRefill && (
        <RefillModal
          medicine={selectedMedForRefill}
          isOpen={!!selectedMedForRefill}
          onClose={() => setSelectedMedForRefill(null)}
          onConfirmRefill={handleRefillConfirm}
        />
      )}

      {selectedMedForDetail && (
        <MedicineDetailModal
          medicine={selectedMedForDetail}
          isOpen={!!selectedMedForDetail}
          onClose={() => setSelectedMedForDetail(null)}
          onOpenRefill={(med) => {
            setSelectedMedForDetail(null);
            setSelectedMedForRefill(med);
          }}
          onEditMedicine={(med) => {
            setSelectedMedForDetail(null);
            setEditingMedicine(med);
            setIsAddMedicineOpen(true);
          }}
          onUpdateConsumed={handleUpdateConsumed}
          onToggleStatus={handleToggleMedicineStatus}
          onExportCalendar={(medId) => handleOpenExportCalendar(medId)}
          onContactDoctor={(med) => {
            setCourseRenewalState({
              isOpen: true,
              medicine: med,
              alertData: null,
              initialMode: 'contact',
            });
          }}
          onRequestRenewal={(med) => {
            setCourseRenewalState({
              isOpen: true,
              medicine: med,
              alertData: null,
              initialMode: 'renew',
            });
          }}
          onInspectPrescription={(rxId) => {
            if (selectedMedForDetail?.photoUrl) {
              setZoomModalData({
                isOpen: true,
                title: `${selectedMedForDetail.name} ${selectedMedForDetail.strength}${selectedMedForDetail.strengthUnit}`,
                subtitle: `Attached Prescription / Document • ${selectedMedForDetail.doctorName || 'Prescribed'}`,
                imageUrl: selectedMedForDetail.photoUrl,
              });
              return;
            }
            const rx = prescriptions.find((p) => p.id === rxId);
            if (rx) {
              setZoomModalData({
                isOpen: true,
                title: `${rx.doctorName} - ${rx.specialty}`,
                subtitle: rx.date,
                imageUrl: rx.photoUrl,
              });
            }
          }}
        />
      )}

      {zoomModalData.isOpen && (
        <ZoomInspectModal
          isOpen={zoomModalData.isOpen}
          onClose={() => setZoomModalData({ ...zoomModalData, isOpen: false })}
          title={zoomModalData.title}
          subtitle={zoomModalData.subtitle}
          imageUrl={zoomModalData.imageUrl}
        />
      )}

      {isExportPDFOpen && (
        <ExportSummaryModal
          isOpen={isExportPDFOpen}
          onClose={() => setIsExportPDFOpen(false)}
          activeProfile={activeProfile}
          medicines={medicines}
          prescriptions={prescriptions}
          testReports={testReports}
          onOpenExportCalendar={() => handleOpenExportCalendar()}
        />
      )}

      {isExportCalendarOpen && (
        <ExportCalendarModal
          isOpen={isExportCalendarOpen}
          onClose={() => {
            setIsExportCalendarOpen(false);
            setExportCalendarMedId(undefined);
          }}
          medicines={medicines}
          profiles={profiles}
          activeProfile={activeProfile}
          initialSelectedMedId={exportCalendarMedId}
        />
      )}

      {/* Course Completion & Doctor Renewal Modal */}
      <CourseRenewalModal
        isOpen={courseRenewalState.isOpen}
        onClose={() =>
          setCourseRenewalState((prev) => ({ ...prev, isOpen: false }))
        }
        medicine={courseRenewalState.medicine}
        alertData={courseRenewalState.alertData}
        prescriptions={prescriptions}
        initialMode={courseRenewalState.initialMode}
        onRenewCourse={handleRenewCourse}
      />
    </div>
  );
}
