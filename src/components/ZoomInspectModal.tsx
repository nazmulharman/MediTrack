import React, { useState } from 'react';
import { ImageCropModal } from './ImageCropModal';

interface ZoomInspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  imageUrl: string;
  pages?: string[];
  onUpdatePages?: (updatedPages: string[]) => void;
}

export const ZoomInspectModal: React.FC<ZoomInspectModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  imageUrl,
  pages,
  onUpdatePages,
}) => {
  if (!isOpen) return null;

  const allPages = pages && pages.length > 0 ? pages : [imageUrl];
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [isCropOpen, setIsCropOpen] = useState<boolean>(false);

  const activeImage = allPages[currentPageIndex] || imageUrl;

  const handleZoomIn = () => {
    setScale((prev) => Math.min(2.5, +(prev + 0.25).toFixed(2)));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.75, +(prev - 0.25).toFixed(2)));
  };

  const handleResetZoom = () => {
    setScale(1.0);
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    if (onUpdatePages) {
      const updated = [...allPages];
      updated[currentPageIndex] = croppedDataUrl;
      onUpdatePages(updated);
    }
    setIsCropOpen(false);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-inverse-surface/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-surface-container-lowest rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-surface-container">
          {/* Header */}
          <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-surface-container-low bg-surface-container-lowest shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary-fixed/60 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">document_scanner</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-headline font-bold text-base text-on-surface truncate">
                    {title || 'Prescription Document'}
                  </h3>
                  {allPages.length > 1 && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                      Page {currentPageIndex + 1} of {allPages.length}
                    </span>
                  )}
                </div>
                {subtitle && <p className="text-xs text-on-surface-variant truncate">{subtitle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Crop Current Page button */}
              <button
                type="button"
                onClick={() => setIsCropOpen(true)}
                className="px-2.5 py-1.5 rounded-full bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Crop and align this page"
              >
                <span className="material-symbols-outlined text-[15px]">crop</span>
                <span className="hidden sm:inline">Crop</span>
              </button>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-surface-container-low text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors shrink-0"
                type="button"
                aria-label="Close viewer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Viewport with Page Image */}
          <div className="relative flex-1 bg-surface-container/60 p-4 overflow-auto flex items-center justify-center min-h-[320px] max-h-[500px]">
            <div className="overflow-hidden rounded-xl flex items-center justify-center transition-transform duration-200 ease-out">
              <img
                src={activeImage}
                alt={`${title} - Page ${currentPageIndex + 1}`}
                className="max-h-[440px] w-auto object-contain rounded-xl shadow-md select-none transition-transform duration-150"
                style={{ transform: `scale(${scale})` }}
                draggable={false}
              />
            </div>

            {/* Left / Right Page Navigation Arrows if multiple pages */}
            {allPages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentPageIndex === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-inverse-surface/80 text-inverse-on-surface backdrop-blur-md flex items-center justify-center hover:bg-inverse-surface disabled:opacity-30 transition-all shadow-lg active:scale-95"
                  title="Previous Page"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPageIndex((prev) => Math.min(allPages.length - 1, prev + 1))
                  }
                  disabled={currentPageIndex === allPages.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-inverse-surface/80 text-inverse-on-surface backdrop-blur-md flex items-center justify-center hover:bg-inverse-surface disabled:opacity-30 transition-all shadow-lg active:scale-95"
                  title="Next Page"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </>
            )}

            {/* Floating Zoom Controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1 p-1 rounded-full bg-inverse-surface/85 text-inverse-on-surface backdrop-blur-md shadow-xl border border-white/10">
              <button
                onClick={handleZoomOut}
                disabled={scale <= 0.75}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 disabled:opacity-40 transition-all"
                type="button"
                title="Zoom out"
              >
                <span className="material-symbols-outlined text-[16px]">remove</span>
              </button>
              <button
                onClick={handleResetZoom}
                className="text-[11px] font-mono font-bold px-1.5 hover:text-primary-fixed transition-colors"
                title="Reset Zoom"
                type="button"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                disabled={scale >= 2.5}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 disabled:opacity-40 transition-all"
                type="button"
                title="Zoom in"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
            </div>
          </div>

          {/* Multi-Page Thumbnail Selector Strip */}
          {allPages.length > 1 && (
            <div className="px-4 py-2 bg-surface-container-low border-t border-surface-container flex items-center justify-center gap-2 overflow-x-auto no-scrollbar shrink-0">
              {allPages.map((pg, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentPageIndex(idx)}
                  className={`relative w-12 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    currentPageIndex === idx
                      ? 'border-primary ring-2 ring-primary/40 scale-105'
                      : 'border-surface-container opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={pg} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[9px] font-bold text-center">
                    {idx + 1}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="p-3.5 flex items-center justify-between bg-surface-container-low border-t border-surface-container shrink-0">
            <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
              <span className="material-symbols-outlined text-[16px]">lock</span>
              <span>Encrypted Multi-Page Document</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold flex items-center gap-1 shadow-sm hover:bg-primary/90 active:scale-95 transition-all"
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">print</span>
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Crop Modal for Viewing Page */}
      {isCropOpen && activeImage && (
        <ImageCropModal
          isOpen={isCropOpen}
          onClose={() => setIsCropOpen(false)}
          imageUrl={activeImage}
          onCropComplete={handleCropComplete}
          title={`Crop Page ${currentPageIndex + 1} of ${allPages.length}`}
          initialAspectRatio="document"
        />
      )}
    </>
  );
};
