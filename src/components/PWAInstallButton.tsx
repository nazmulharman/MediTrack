import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'settings' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone PWA mode, suppress button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'settings') {
      return (
        <button
          type="button"
          onClick={install}
          className={`w-full p-3 rounded-2xl bg-primary text-on-primary font-headline font-bold text-xs flex items-center justify-between shadow-sm hover:bg-primary-container active:scale-98 transition-all ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[19px]">install_mobile</span>
            <div className="text-left">
              <span className="block font-bold">Install MediTrack App</span>
              <span className="text-[10px] opacity-90 block">Add to Home Screen for fast offline access</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-white/20 text-[11px] font-bold">
            Install
          </span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={install}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary-container active:scale-95 transition-all ${className}`}
        title="Install MediTrack as Progressive Web App"
      >
        <span className="material-symbols-outlined text-[16px]">install_mobile</span>
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported on WebKit, so provide guided instructions)
  if (isIOS) {
    if (variant === 'settings') {
      return (
        <>
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            className={`w-full p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container text-left text-xs font-semibold text-on-surface flex items-center justify-between border border-surface-container ${className}`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[19px]">add_to_home_screen</span>
              <div>
                <span className="font-bold text-on-surface block">Add to iPhone / iPad Home Screen</span>
                <span className="text-[10px] text-on-surface-variant block">Run standalone like a native iOS app</span>
              </div>
            </div>
            <span className="text-primary text-xs font-bold">Guide →</span>
          </button>

          {showIOSGuide && (
            <div
              className="fixed inset-0 z-60 flex items-center justify-center bg-inverse-surface/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
              onClick={() => setShowIOSGuide(false)}
            >
              <div
                className="w-full max-w-sm rounded-3xl bg-surface-container-lowest p-5 shadow-2xl border border-surface-container space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">ios_share</span>
                    </div>
                    <h3 className="font-headline font-bold text-sm text-on-surface">Install on iPhone / iPad</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowIOSGuide(false)}
                    className="w-7 h-7 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>

                <div className="space-y-3 text-xs text-on-surface-variant bg-surface-container-low p-3.5 rounded-2xl">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="leading-snug">
                      Tap the <strong className="text-on-surface">Share</strong> icon at the bottom of Safari (a box with an arrow pointing up).
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="leading-snug">
                      Scroll down in the action sheet and select <strong className="text-on-surface">Add to Home Screen</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="leading-snug">
                      Tap <strong className="text-on-surface">Add</strong> in the top-right corner. MediTrack will now open directly from your home screen.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-headline font-bold text-xs shadow-sm hover:bg-primary-container transition-all"
                >
                  Got It
                </button>
              </div>
            </div>
          )}
        </>
      );
    }

    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/5 transition-all ${className}`}
          title="Add to iOS Home Screen"
        >
          <span className="material-symbols-outlined text-[15px]">ios_share</span>
          <span>Add to Home</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-inverse-surface/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-3xl bg-surface-container-lowest p-5 shadow-2xl border border-surface-container space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">ios_share</span>
                  </div>
                  <h3 className="font-headline font-bold text-sm text-on-surface">Install on iPhone / iPad</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="w-7 h-7 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              <div className="space-y-3 text-xs text-on-surface-variant bg-surface-container-low p-3.5 rounded-2xl">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="leading-snug">
                    Tap the <strong className="text-on-surface">Share</strong> icon at the bottom of Safari toolbar.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="leading-snug">
                    Scroll down and tap <strong className="text-on-surface">Add to Home Screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <p className="leading-snug">
                    Tap <strong className="text-on-surface">Add</strong> in top-right. Launch MediTrack like a native app.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-headline font-bold text-xs shadow-sm hover:bg-primary-container transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
