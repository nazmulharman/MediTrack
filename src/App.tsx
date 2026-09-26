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
import { NotificationBanner } from './components/NotificationBanner';
import { AddReportModal } from './components/AddReportModal';
import { AddPrescriptionModal } from './components/AddPrescriptionModal';
import { VitalsModal } from './components/VitalsModal';
import { SmartLogoModal } from './components/SmartLogoModal';
import { useNotificationScheduler } from './hooks/useNotificationScheduler';
import { notificationService } from './services/notificationService';
import { roundFraction, formatFraction } from './utils/fractionUtils';

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<TabType>('today');

  // Core Data with localStorage persistence
  const [profiles, setProfiles] = useState<PatientProfile[]>(() => {
    const saved = localStorage.getItem('dosekeeper_profiles');
    return saved ? JSON.parse(saved) : INITIAL_PROFILES;
  });

  const [activeProfile, setActiveProfile] = useState<PatientProfile>(() => {
    return profiles[0] || INITIAL_PROFILES[0];
  });

  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    const saved = localStorage.getItem('dosekeeper_medicines');
    return saved ? JSON.parse(saved) : INITIAL_MEDICINES;
  });

  const [doses, setDoses] = useState<DoseItem[]>(() => {
    const saved = localStorage.getItem('dosekeeper_doses');
    return saved ? JSON.parse(saved) : INITIAL_DOSES;
  });

  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>(() => {
    const saved = localStorage.getItem('dosekeeper_prescriptions');
    return saved ? JSON.parse(saved) : INITIAL_PRESCRIPTIONS;
  });

  const [testReports, setTestReports] = useState<TestReport[]>(() => {
    const saved = localStorage.getItem('dosekeeper_reports');
    return saved ? JSON.parse(saved) : INITIAL_TEST_REPORTS;
  });

  const [visits, setVisits] = useState<DoctorVisit[]>(() => {
    const saved = localStorage.getItem('dosekeeper_visits');
    return saved ? JSON.parse(saved) : INITIAL_VISITS;
  });

  const [vitals, setVitals] = useState<HealthVitalLog[]>(() => {
    const saved = localStorage.getItem('dosekeeper_vitals');
    return saved ? JSON.parse(saved) : INITIAL_VITALS;
  });

  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('dosekeeper_settings');
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
  const [isSmartLogoOpen, setIsSmartLogoOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('dosekeeper_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('dosekeeper_medicines', JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    localStorage.setItem('dosekeeper_doses', JSON.stringify(doses));
  }, [doses]);

  useEffect(() => {
    localStorage.setItem('dosekeeper_prescriptions', JSON.stringify(prescriptions));
  }, [prescriptions]);

  useEffect(() => {
    localStorage.setItem('dosekeeper_reports', JSON.stringify(testReports));
  }, [testReports]);

  useEffect(() => {
    localStorage.setItem('dosekeeper_visits', JSON.stringify(visits));
  }, [visits]);

  useEffect(() => {
    localStorage.setItem('dosekeeper_vitals', JSON.stringify(vitals));
  }, [vitals]);

  useEffect(() => {
    localStorage.setItem('dosekeeper_settings', JSON.stringify(settings));
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
  };

  const handleSavePrescription = (newPrescription: PrescriptionRecord) => {
    setPrescriptions((prev) => [newPrescription, ...prev]);
  };

  const handleDeleteReport = (reportId: string) => {
    setTestReports((prev) => prev.filter((r) => r.id !== reportId));
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

  // Web Notification Scheduler Hook
  const { testTrigger } = useNotificationScheduler(doses, (doseId, action) => {
    handleUpdateDoseStatus(doseId, action);
  });

  const handleTestNotification = (targetDose?: DoseItem) => {
    const doseToTest =
      targetDose ||
      doses.find((d) => d.status === 'pending') ||
      doses[0];
    if (doseToTest) {
      testTrigger(doseToTest);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col antialiased text-on-surface">
      {/* Top Application Bar */}
      <Header
        currentTab={currentTab}
        activeProfile={activeProfile}
        onOpenProfiles={() => setCurrentTab('settings')}
        onOpenSmartLogo={() => setIsSmartLogoOpen(true)}
      />

      {/* Actionable Web Notification Banner with Taken and Skip */}
      <NotificationBanner
        onDoseAction={(doseId, action) => {
          handleUpdateDoseStatus(doseId, action);
        }}
      />

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
            onDeleteReport={handleDeleteReport}
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
            onTestNotification={() => handleTestNotification()}
            onOpenSmartLogo={() => setIsSmartLogoOpen(true)}
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
        />
      )}
    </div>
  );
}
