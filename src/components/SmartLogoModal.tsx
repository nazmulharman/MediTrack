import React, { useState } from 'react';
import { SmartLogo, LogoColorScheme } from './SmartLogo';

interface SmartLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartLogoModal: React.FC<SmartLogoModalProps> = ({ isOpen, onClose }) => {
  const [selectedScheme, setSelectedScheme] = useState<LogoColorScheme>('default');
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const schemes: { id: LogoColorScheme; name: string; desc: string; previewBg: string }[] = [
    {
      id: 'default',
      name: 'Ocean Cyan & Emerald',
      desc: 'Signature clinical vitality with glowing telemetry nodes',
      previewBg: 'bg-emerald-950/20 border-emerald-500/30',
    },
    {
      id: 'aurora',
      name: 'Aurora Tech Violet',
      desc: 'Futuristic AI health gradient with neon ultraviolet aura',
      previewBg: 'bg-indigo-950/20 border-indigo-500/30',
    },
    {
      id: 'clinical',
      name: 'Clinical Slate Clean',
      desc: 'High-contrast medical precision for professional reporting',
      previewBg: 'bg-slate-100 border-slate-300',
    },
    {
      id: 'midnight',
      name: 'OLED Cyber Midnight',
      desc: 'Deep black background with laser-sharp luminescence',
      previewBg: 'bg-black border-cyan-500/40',
    },
  ];

  // Helper to extract SVG string and download
  const handleDownloadSvg = () => {
    const svgEl = document.getElementById('smart-logo-preview-svg')?.querySelector('svg');
    if (!svgEl) return;

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgEl);

    // Add namespace if missing
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meditrack-smart-logo-${selectedScheme}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to render to Canvas and download high-res PNG (1024x1024)
  const handleDownloadPng = () => {
    setIsDownloading(true);
    const svgEl = document.getElementById('smart-logo-preview-svg')?.querySelector('svg');
    if (!svgEl) {
      setIsDownloading(false);
      return;
    }

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 1024 / 120;
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, 1024, 1024);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `meditrack-smart-logo-${selectedScheme}-1024px.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
      setIsDownloading(false);
    };
    img.src = url;
  };

  const handleCopySvg = () => {
    const svgEl = document.getElementById('smart-logo-preview-svg')?.querySelector('svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    navigator.clipboard.writeText(source);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-surface-container">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-surface-container bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">auto_awesome</span>
            <div>
              <h3 className="font-headline font-bold text-base text-on-surface">
                Smart Logo & Brand System
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                MediTrack intelligent visual identity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 no-scrollbar">
          {/* Logo Showcase Stage */}
          <div className="rounded-3xl bg-gradient-to-b from-surface-container-low to-surface-container p-6 flex flex-col items-center justify-center border border-surface-container-high relative overflow-hidden">
            {/* Background ambient lighting */}
            <div className="absolute inset-0 bg-radial from-primary/10 via-transparent to-transparent pointer-events-none" />

            <div id="smart-logo-preview-svg" className="relative z-10 my-2">
              <SmartLogo
                size="2xl"
                colorScheme={selectedScheme}
                showBeacon={true}
                pulseAnimated={true}
              />
            </div>

            <div className="text-center mt-3 z-10">
              <h2 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight flex items-center justify-center gap-2">
                MediTrack
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-on-primary font-bold">
                  v2.5 Smart
                </span>
              </h2>
              <p className="text-xs text-on-surface-variant font-medium mt-1">
                Medicine Dosage, Inventory & Encrypted Health Vault
              </p>
            </div>

            {/* Quick Action Buttons for the logo */}
            <div className="flex items-center gap-2 mt-4 z-10">
              <button
                type="button"
                onClick={handleDownloadSvg}
                className="px-3.5 py-1.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-xs font-bold text-on-surface border border-surface-container-high shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">download</span>
                Vector SVG
              </button>

              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={isDownloading}
                className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-container text-xs font-bold text-on-primary shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">image</span>
                {isDownloading ? 'Rendering...' : 'High-Res PNG (1024px)'}
              </button>

              <button
                type="button"
                onClick={handleCopySvg}
                className="px-3 py-1.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-xs font-bold text-on-surface border border-surface-container-high shadow-xs flex items-center gap-1 transition-transform active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px] text-secondary">
                  {copied ? 'check' : 'content_copy'}
                </span>
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>

          {/* Theme Palette Switcher */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-headline font-bold text-xs text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">palette</span>
                Theme Palettes
              </h4>
              <span className="text-[11px] text-on-surface-variant font-medium">
                Tap to preview in realtime
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {schemes.map((s) => {
                const isSelected = selectedScheme === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedScheme(s.id)}
                    className={`p-3 rounded-2xl text-left border transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-surface-container-high/80 border-primary ring-2 ring-primary/20 shadow-sm'
                        : 'bg-surface-container-lowest border-surface-container hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="mt-0.5">
                      <SmartLogo size="xs" colorScheme={s.id} showBeacon={false} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-on-surface truncate">
                          {s.name}
                        </span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-primary text-[16px]">
                            check_circle
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-on-surface-variant block line-clamp-1 mt-0.5">
                        {s.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Smart Anatomy & Metaphor Breakdown */}
          <div className="space-y-2.5">
            <h4 className="font-headline font-bold text-xs text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
              Smart Logo Concept & Anatomy
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container space-y-1">
                <div className="flex items-center gap-1.5 text-primary font-bold text-[11px]">
                  <span className="material-symbols-outlined text-[16px]">pill</span>
                  3D Precision Capsule
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Dual-tone medical capsule with precision split markings, representing flexible fractional dosage (halves & quarters) and course tracking.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-600 font-bold text-[11px]">
                  <span className="material-symbols-outlined text-[16px]">vital_signs</span>
                  Telemetry Rhythm Wave
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Vital pulse and schedule trajectory weaving through the capsule, symbolizing live dose timing, heart health, and adherence streak graphs.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-[11px]">
                  <span className="material-symbols-outlined text-[16px]">shield_with_heart</span>
                  Protective Vault Shield
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Subtle architectural crest enclosing the core, signifying zero-knowledge encrypted storage for lab reports and prescriptions.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px]">
                  <span className="material-symbols-outlined text-[16px]">radar</span>
                  Active Synapse Beacon
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Glowing pulsing node denoting real-time Web Push alarms, automated refill forecasts, and scheduled course-end reminders.
                </p>
              </div>
            </div>
          </div>

          {/* Sizing & Lockups Preview */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container space-y-3">
            <h4 className="font-headline font-bold text-xs text-on-surface flex items-center justify-between">
              <span>Adaptive Sizing & Lockups</span>
              <span className="text-[10px] text-outline font-medium">Scales crisp from 24px to 1024px</span>
            </h4>

            <div className="flex items-center justify-around py-2 bg-surface-container-lowest rounded-xl p-3 border border-surface-container-high">
              <div className="flex flex-col items-center gap-1">
                <SmartLogo size="xs" colorScheme={selectedScheme} />
                <span className="text-[9px] text-outline font-bold">24px App Bar</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <SmartLogo size="sm" colorScheme={selectedScheme} />
                <span className="text-[9px] text-outline font-bold">34px Header</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <SmartLogo size="md" colorScheme={selectedScheme} />
                <span className="text-[9px] text-outline font-bold">42px Standard</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <SmartLogo size="lg" colorScheme={selectedScheme} />
                <span className="text-[9px] text-outline font-bold">56px App Icon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-container bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-on-surface-variant font-medium">
              SVG Vector Brand Asset • Ready to Use
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary-container active:scale-95 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
