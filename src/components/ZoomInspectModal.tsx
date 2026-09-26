import React, { useState } from 'react';

interface ZoomInspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  imageUrl: string;
}

export const ZoomInspectModal: React.FC<ZoomInspectModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  imageUrl,
}) => {
  if (!isOpen) return null;

  const [scale, setScale] = useState<number>(1.0);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(2.5, +(prev + 0.25).toFixed(2)));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.75, +(prev - 0.25).toFixed(2)));
  };

  const handleResetZoom = () => {
    setScale(1.0);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border border-surface-container">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-surface-container-low bg-surface-container-lowest">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary-fixed/60 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">document_scanner</span>
            </div>
            <div className="min-w-0">
              <h3 className="font-headline font-bold text-base text-on-surface truncate">
                {title || 'Prescription Document'}
              </h3>
              {subtitle && <p className="text-xs text-on-surface-variant truncate">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container-low text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors shrink-0"
            type="button"
            aria-label="Close viewer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Viewport */}
        <div className="relative flex-1 bg-surface-container/60 p-4 overflow-auto flex items-center justify-center min-h-[340px] max-h-[520px]">
          <div className="overflow-hidden rounded-xl flex items-center justify-center transition-transform duration-200 ease-out">
            <img
              src={imageUrl}
              alt={title}
              className="max-h-[460px] w-auto object-contain rounded-xl shadow-md select-none transition-transform duration-150"
              style={{ transform: `scale(${scale})` }}
              draggable={false}
            />
          </div>

          {/* Floating Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1 p-1 rounded-full bg-inverse-surface/85 text-inverse-on-surface backdrop-blur-md shadow-xl border border-white/10">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.75}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 disabled:opacity-40 transition-all"
              type="button"
              title="Zoom out"
            >
              <span className="material-symbols-outlined text-[18px]">remove</span>
            </button>
            <button
              onClick={handleResetZoom}
              className="text-[12px] font-mono font-bold px-2 hover:text-primary-fixed transition-colors"
              title="Reset Zoom"
              type="button"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              disabled={scale >= 2.5}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 disabled:opacity-40 transition-all"
              type="button"
              title="Zoom in"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 flex items-center justify-between bg-surface-container-low border-t border-surface-container">
          <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px]">lock</span>
            Encrypted Document View
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                alert('Document exported to encrypted vault storage successfully.');
              }}
              className="px-3 py-1.5 rounded-xl bg-surface-container-highest text-on-surface text-xs font-semibold flex items-center gap-1 hover:bg-surface-container active:scale-95 transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">download</span>
              Save Copy
            </button>
            <button
              onClick={() => {
                window.print();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold flex items-center gap-1 shadow-sm hover:bg-primary-container active:scale-95 transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">print</span>
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
