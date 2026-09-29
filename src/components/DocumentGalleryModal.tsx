import React, { useState, useEffect, useCallback } from 'react';
import { ImageCropModal } from './ImageCropModal';

export interface GalleryItem {
  id: string;
  type: 'prescription' | 'report';
  title: string;
  subtitle: string;
  date: string;
  patientId: string;
  patientName?: string;
  imageUrl: string;
  pages?: string[];
  badgeLabel: string;
  badgeIcon: string;
  badgeColorCls: string;
  doctorOrFacility: string;
  summaryOrDiagnosis?: string;
  linkedMedicines?: string[];
  flag?: 'normal' | 'attention' | 'critical';
  pharmacy?: string;
  refillsRemaining?: number;
  tags?: string[];
}

interface DocumentGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: GalleryItem[];
  initialIndex?: number;
  onDeleteItem?: (id: string, type: 'prescription' | 'report') => void;
  onUpdateItemImage?: (id: string, newImageUrl: string, updatedPages?: string[]) => void;
}

export const DocumentGalleryModal: React.FC<DocumentGalleryModalProps> = ({
  isOpen,
  onClose,
  items,
  initialIndex = 0,
  onDeleteItem,
  onUpdateItemImage,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState<boolean>(true);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [isCropOpen, setIsCropOpen] = useState<boolean>(false);

  // Sync index when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const safeIndex = Math.max(0, Math.min(items.length - 1, initialIndex));
      setCurrentIndex(safeIndex);
      setActivePageIndex(0);
      setScale(1.0);
      setRotation(0);
    }
  }, [isOpen, initialIndex, items.length]);

  const currentItem: GalleryItem | undefined = items[currentIndex];
  const activePages = currentItem?.pages && currentItem.pages.length > 0 ? currentItem.pages : (currentItem ? [currentItem.imageUrl] : []);
  const activeImageUrl = activePages[activePageIndex] || currentItem?.imageUrl || '';

  const handlePrev = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    setActivePageIndex(0);
    setScale(1.0);
    setRotation(0);
  }, [items.length]);

  const handleNext = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    setActivePageIndex(0);
    setScale(1.0);
    setRotation(0);
  }, [items.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        setScale((s) => Math.min(3.0, +(s + 0.25).toFixed(2)));
      } else if (e.key === '-') {
        setScale((s) => Math.max(0.75, +(s - 0.25).toFixed(2)));
      } else if (e.key === '0') {
        setScale(1.0);
        setRotation(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  if (!isOpen || !currentItem) return null;

  const handleZoomIn = () => setScale((s) => Math.min(3.0, +(s + 0.25).toFixed(2)));
  const handleZoomOut = () => setScale((s) => Math.max(0.75, +(s - 0.25).toFixed(2)));
  const handleResetZoom = () => {
    setScale(1.0);
    setRotation(0);
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${currentItem.title} - MediTrack Document</title>
          <style>
            body { font-family: system-ui, sans-serif; margin: 24px; color: #1e293b; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            p { font-size: 14px; color: #64748b; margin-top: 0; }
            img { max-width: 100%; max-height: 85vh; object-fit: contain; margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h1>${currentItem.title}</h1>
          <p>${currentItem.subtitle} • Date: ${currentItem.date}</p>
          <img src="${currentItem.imageUrl}" alt="${currentItem.title}" />
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopySummary = () => {
    const textToCopy = `${currentItem.title}\n${currentItem.subtitle}\nDate: ${currentItem.date}\n${
      currentItem.summaryOrDiagnosis || ''
    }`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col justify-between animate-in fade-in duration-200 select-none overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Gallery Navigation Bar */}
      <header className="p-3 sm:p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 via-black/50 to-transparent">
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${currentItem.badgeColorCls}`}
          >
            <span className="material-symbols-outlined text-[20px]">{currentItem.badgeIcon}</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${currentItem.badgeColorCls}`}
              >
                {currentItem.badgeLabel}
              </span>
              <span className="text-white/60 text-xs font-mono font-medium">
                {currentIndex + 1} of {items.length}
              </span>
            </div>
            <h2 className="text-white font-headline font-bold text-sm sm:text-base truncate max-w-[260px] sm:max-w-md mt-0.5">
              {currentItem.title}
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowDetailsDrawer(!showDetailsDrawer)}
            type="button"
            className={`p-2 rounded-full transition-colors text-white/80 hover:text-white ${
              showDetailsDrawer ? 'bg-white/20 text-white' : 'hover:bg-white/10'
            }`}
            title="Toggle Details Panel"
          >
            <span className="material-symbols-outlined text-[20px]">info</span>
          </button>

          <button
            onClick={handlePrint}
            type="button"
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Print Document"
          >
            <span className="material-symbols-outlined text-[20px]">print</span>
          </button>

          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-full text-white/90 hover:text-white hover:bg-white/20 transition-colors bg-white/10"
            title="Close Gallery (Esc)"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
      </header>

      {/* Main Viewport & Interactive Image Canvas */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden p-2 sm:p-6">
        {/* Previous Button */}
        {items.length > 1 && (
          <button
            onClick={handlePrev}
            type="button"
            aria-label="Previous document"
            className="absolute left-2 sm:left-4 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xl"
          >
            <span className="material-symbols-outlined text-[26px]">arrow_back_ios_new</span>
          </button>
        )}

        {/* Main Document Image Container */}
        <div className="relative max-h-full max-w-full flex flex-col items-center justify-center overflow-hidden">
          <img
            key={`${currentItem.id}-${activePageIndex}`}
            src={activeImageUrl}
            alt={currentItem.title}
            draggable={false}
            className="max-h-[62vh] sm:max-h-[70vh] max-w-[90vw] sm:max-w-[78vw] object-contain rounded-2xl shadow-2xl transition-transform duration-200 ease-out select-none border border-white/10"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
            }}
          />

          {/* Multi-page Selector within Document */}
          {activePages.length > 1 && (
            <div className="mt-2 flex items-center gap-1.5 p-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 shadow-lg z-30">
              <button
                type="button"
                onClick={() => setActivePageIndex((p) => Math.max(0, p - 1))}
                disabled={activePageIndex === 0}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <span className="text-[11px] font-bold text-white px-2">
                Page {activePageIndex + 1} of {activePages.length}
              </span>
              <button
                type="button"
                onClick={() => setActivePageIndex((p) => Math.min(activePages.length - 1, p + 1))}
                disabled={activePageIndex === activePages.length - 1}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          )}
        </div>

        {/* Next Button */}
        {items.length > 1 && (
          <button
            onClick={handleNext}
            type="button"
            aria-label="Next document"
            className="absolute right-2 sm:right-4 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xl"
          >
            <span className="material-symbols-outlined text-[26px]">arrow_forward_ios</span>
          </button>
        )}

        {/* Floating Canvas Controls (Zoom In/Out, Reset, Rotate, Crop) */}
        <div className="absolute top-2 sm:top-4 right-4 z-30 flex items-center gap-1 p-1 rounded-full bg-black/70 text-white backdrop-blur-md border border-white/15 shadow-xl">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.75}
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 disabled:opacity-30 transition-all"
            title="Zoom Out (-)"
          >
            <span className="material-symbols-outlined text-[18px]">remove</span>
          </button>
          <button
            onClick={handleResetZoom}
            type="button"
            className="px-2 text-[11px] font-mono font-bold hover:text-primary transition-colors"
            title="Reset Zoom (0)"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 3.0}
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 disabled:opacity-30 transition-all"
            title="Zoom In (+)"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
          <div className="w-[1px] h-4 bg-white/20 mx-0.5" />
          <button
            onClick={handleRotate}
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
            title="Rotate 90°"
          >
            <span className="material-symbols-outlined text-[18px]">rotate_right</span>
          </button>
          <button
            onClick={() => setIsCropOpen(true)}
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-primary"
            title="Crop & Align Document"
          >
            <span className="material-symbols-outlined text-[18px]">crop</span>
          </button>
        </div>
      </div>

      {/* Floating Copied Toast */}
      {copiedNotification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-primary text-on-primary px-4 py-2 rounded-full shadow-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          <span>Document info copied to clipboard</span>
        </div>
      )}

      {/* Slide-up Document Info Drawer */}
      {showDetailsDrawer && (
        <div className="z-20 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-surface-container-high rounded-t-3xl p-4 max-h-[35vh] overflow-y-auto no-scrollbar shadow-2xl text-on-surface">
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${currentItem.badgeColorCls}`}
                  >
                    {currentItem.badgeLabel}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    {currentItem.date}
                  </span>
                  {currentItem.patientName && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container font-semibold text-on-surface">
                      👤 {currentItem.patientName}
                    </span>
                  )}
                  {currentItem.flag && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        currentItem.flag === 'critical'
                          ? 'bg-error-container text-on-error-container'
                          : currentItem.flag === 'attention'
                          ? 'bg-primary-fixed text-on-primary-fixed-variant'
                          : 'bg-secondary-fixed text-on-secondary-fixed-variant'
                      }`}
                    >
                      {currentItem.flag.toUpperCase()}
                    </span>
                  )}
                </div>

                <h3 className="font-headline font-bold text-base text-on-surface mt-1">
                  {currentItem.title}
                </h3>
                <p className="text-xs text-on-surface-variant font-medium">
                  {currentItem.doctorOrFacility}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleCopySummary}
                  type="button"
                  className="px-2.5 py-1.5 rounded-xl bg-surface-container text-xs font-bold hover:bg-surface-container-high transition-colors flex items-center gap-1 text-on-surface"
                >
                  <span className="material-symbols-outlined text-[15px]">content_copy</span>
                  Copy
                </button>
                {onDeleteItem && (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete "${currentItem.title}" from your medical records?`
                        )
                      ) {
                        onDeleteItem(currentItem.id, currentItem.type);
                        if (items.length <= 1) {
                          onClose();
                        } else {
                          handleNext();
                        }
                      }
                    }}
                    type="button"
                    className="p-1.5 rounded-xl text-outline hover:text-error hover:bg-error-container/30 transition-colors"
                    title="Delete Document"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
              </div>
            </div>

            {/* Clinical Diagnosis or Summary */}
            {currentItem.summaryOrDiagnosis && (
              <div className="p-3 rounded-2xl bg-surface-container-low text-xs leading-relaxed text-on-surface space-y-1">
                <span className="font-bold text-[11px] uppercase tracking-wider text-outline block">
                  {currentItem.type === 'prescription'
                    ? 'Clinical Directions / Diagnosis'
                    : 'Diagnostic Findings Summary'}
                </span>
                <p>{currentItem.summaryOrDiagnosis}</p>
              </div>
            )}

            {/* Linked Medicines (if Rx) */}
            {currentItem.linkedMedicines && currentItem.linkedMedicines.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-outline uppercase tracking-wider block">
                  Prescribed Medications
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {currentItem.linkedMedicines.map((med, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed-variant text-xs font-semibold"
                    >
                      <span className="material-symbols-outlined text-[13px] text-primary">
                        pill
                      </span>
                      {med}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Filmstrip Carousel */}
      <footer className="z-20 bg-black/80 backdrop-blur-md p-2 border-t border-white/10">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
          {items.map((item, index) => {
            const isSelected = index === currentIndex;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentIndex(index);
                  setScale(1.0);
                  setRotation(0);
                }}
                type="button"
                className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/40 scale-105 opacity-100'
                    : 'border-white/20 opacity-50 hover:opacity-90 hover:scale-100'
                }`}
                title={item.title}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <span
                  className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full ${
                    item.type === 'prescription' ? 'bg-primary' : 'bg-secondary'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </footer>

      {/* Image Crop Modal */}
      {isCropOpen && activeImageUrl && (
        <ImageCropModal
          isOpen={isCropOpen}
          onClose={() => setIsCropOpen(false)}
          imageUrl={activeImageUrl}
          onCropComplete={(croppedData) => {
            if (onUpdateItemImage && currentItem) {
              const updatedPages = [...activePages];
              updatedPages[activePageIndex] = croppedData;
              onUpdateItemImage(currentItem.id, croppedData, updatedPages);
            }
            setIsCropOpen(false);
          }}
          title={`Crop Document ${activePages.length > 1 ? `- Page ${activePageIndex + 1}` : ''}`}
          initialAspectRatio="document"
        />
      )}
    </div>
  );
};
