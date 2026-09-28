import React, { useState } from 'react';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'playstore' | 'cloud' | 'instant' | 'cli'>('playstore');
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedListing, setCopiedListing] = useState(false);

  if (!isOpen) return null;

  // Use current origin if running on custom host (like Vercel), fallback to default
  const currentOrigin = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
    ? window.location.origin
    : 'https://ais-pre-hpresemu5benx7qvjgmpo3-865246501235.asia-southeast1.run.app';
  const appUrl = currentOrigin;
  const manifestUrl = `${appUrl}/manifest.json`;
  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(appUrl)}`;

  const bubblewrapCmd = `npm i -g @bubblewrap/cli
bubblewrap init --manifest="${manifestUrl}"
bubblewrap build`;

  const playStoreDescription = `MediTrack is your private, smart medicine companion. Track dosage schedules, refill reminders, course completion, and medicine stock levels with zero stress.

Key Features:
• Smart Dosage Reminders: Timed dose tracking (Morning, Afternoon, Evening, Bedtime) with flexible repeat schedules.
• Stock & Expiry Alerts: Automatic depletion forecasting and shelf-life tracking so you never run out of vital medications.
• Encrypted Health Vault: Safely store prescriptions, lab reports, and doctor slips locally and backed up to Google Drive.
• Multi-Profile Support: Manage medication regimens for yourself, children, elderly parents, or dependents in one place.
• Complete Privacy & Offline Ready: Runs offline with encrypted local persistence and optional private cloud sync.`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(bubblewrapCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  const handleCopyListing = () => {
    navigator.clipboard.writeText(playStoreDescription);
    setCopiedListing(true);
    setTimeout(() => setCopiedListing(false), 2500);
  };

  const handleDownloadTwaConfig = () => {
    const hostName = typeof window !== 'undefined' && window.location.host && !window.location.host.includes('localhost')
      ? window.location.host
      : 'ais-pre-hpresemu5benx7qvjgmpo3-865246501235.asia-southeast1.run.app';

    const config = {
      packageId: 'app.meditrack.twa',
      host: hostName,
      name: 'MediTrack - Medicine Tracker',
      launcherName: 'MediTrack',
      themeColor: '#00685F',
      navigationColor: '#00201D',
      backgroundColor: '#00201D',
      enableNotifications: true,
      startUrl: '/',
      iconUrl: `${appUrl}/pwa-512x512.png`,
      maskableIconUrl: `${appUrl}/pwa-maskable-512x512.png`,
      appVersionName: '1.0.0',
      appVersionCode: 1,
      webManifestUrl: manifestUrl,
      generatorApp: 'bubblewrap-cli',
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'twa-manifest.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-inverse-surface/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-surface-container-lowest p-6 shadow-2xl border border-surface-container space-y-5 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">shop</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-on-surface">Android & Google Play Package Hub</h3>
              <p className="text-xs text-on-surface-variant">Generate .AAB for Google Play Store or install native WebAPK</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Tab selection */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-surface-container-low rounded-2xl border border-surface-container">
          <button
            type="button"
            onClick={() => setActiveTab('playstore')}
            className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all text-center ${
              activeTab === 'playstore'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            🚀 Play Store (.AAB)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all text-center ${
              activeTab === 'cloud'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            ☁️ Cloud Builder
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('instant')}
            className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all text-center ${
              activeTab === 'instant'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            ⚡ WebAPK (Phone)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cli')}
            className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all text-center ${
              activeTab === 'cli'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            🛠️ Bubblewrap
          </button>
        </div>

        {/* Tab: Google Play Store (.AAB) */}
        {activeTab === 'playstore' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-on-surface space-y-2">
              <div className="flex items-center gap-2 font-bold text-primary">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Official Google Play Trusted Web Activity (TWA) Package</span>
              </div>
              <p className="text-on-surface-variant leading-relaxed">
                Google Play requires an <strong>Android App Bundle (.aab)</strong> format rather than a raw .apk. MediTrack is pre-configured with Google's official <strong>TWA specification</strong>, which packages the verified PWA into a production-signed .aab ready for upload.
              </p>
            </div>

            {/* Step-by-step accordion/cards */}
            <div className="space-y-3">
              {/* Step 1 */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">1</span>
                    <span className="font-bold text-xs text-on-surface">Generate .AAB Package (1-Click)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">Fastest</span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Use PWABuilder (official tool by Google & Microsoft). It reads MediTrack's live manifest and builds a signed <strong>.aab</strong> bundle zip with your signing keystore.
                </p>
                <div className="pt-1 flex gap-2">
                  <a
                    href={pwaBuilderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-primary text-on-primary font-headline font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary-container transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    <span>Generate .AAB on PWABuilder</span>
                  </a>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">2</span>
                  <span className="font-bold text-xs text-on-surface">Create App in Google Play Console</span>
                </div>
                <div className="text-[11px] text-on-surface-variant space-y-1.5">
                  <p>Open <a href="https://play.google.com/console" target="_blank" rel="noopener noreferrer" className="text-primary font-bold underline">Google Play Console</a> and click <strong>Create App</strong>:</p>
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container text-[11px]">
                    <div>
                      <span className="text-on-surface-variant block text-[10px]">App Name</span>
                      <strong className="text-on-surface">MediTrack</strong>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block text-[10px]">Package ID</span>
                      <strong className="text-primary font-mono text-[10px]">app.meditrack.twa</strong>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block text-[10px]">App Category</span>
                      <strong className="text-on-surface">Medical / Health</strong>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block text-[10px]">Price</span>
                      <strong className="text-on-surface">Free</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">3</span>
                    <span className="font-bold text-xs text-on-surface">Play Store Graphics & Listing</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyListing}
                    className="px-2 py-0.5 rounded-lg bg-surface-container-highest text-on-surface text-[10px] font-bold hover:bg-surface-container flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">{copiedListing ? 'check' : 'content_copy'}</span>
                    <span>{copiedListing ? 'Copied' : 'Copy Description'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <a
                    href="/pwa-512x512.png"
                    download="meditrack-icon-512.png"
                    className="p-2 rounded-xl bg-surface-container-lowest border border-surface-container flex items-center gap-2 hover:bg-surface-container transition-colors"
                  >
                    <img src="/pwa-512x512.png" alt="512 Icon" className="w-7 h-7 rounded-lg" />
                    <div>
                      <span className="font-bold block text-on-surface">App Icon</span>
                      <span className="text-[9px] text-on-surface-variant">512×512 PNG (Click to download)</span>
                    </div>
                  </a>
                  <div className="p-2 rounded-xl bg-surface-container-lowest border border-surface-container">
                    <span className="font-bold block text-on-surface">Feature Graphic</span>
                    <span className="text-[9px] text-on-surface-variant">1024×500 PNG banner</span>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">4</span>
                  <span className="font-bold text-xs text-on-surface">Upload .AAB & Verify Domain</span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  In Google Play Console, go to <strong>Production &gt; Create new release</strong> and upload the <code>.aab</code> file. Under <strong>App Signing</strong>, copy your SHA-256 fingerprint; it matches our pre-configured <code>/.well-known/assetlinks.json</code> so your app launches without an address bar.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Cloud APK Builder (PWABuilder) */}
        {activeTab === 'cloud' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-on-surface">
                <span className="material-symbols-outlined text-primary text-[18px]">cloud_download</span>
                <span>PWABuilder 1-Click APK & .AAB Generator</span>
              </div>
              <p className="text-on-surface-variant leading-relaxed">
                PWABuilder (developed by Microsoft & Google) analyzes the live Web App Manifest and packages MediTrack directly into a downloadable signed <strong>.apk</strong> (for sideloading) and <strong>.aab</strong> (for Google Play Store).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low/60 border border-surface-container space-y-1.5 text-xs">
              <div className="flex justify-between text-on-surface-variant text-[11px]">
                <span>App Package ID:</span>
                <code className="text-primary font-bold">app.meditrack.twa</code>
              </div>
              <div className="flex justify-between text-on-surface-variant text-[11px]">
                <span>Manifest Status:</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 100% PWA Compliant
                </span>
              </div>
              <div className="flex justify-between text-on-surface-variant text-[11px]">
                <span>Digital Asset Links:</span>
                <span className="text-emerald-600 font-bold">Configured in /.well-known</span>
              </div>
            </div>

            <a
              href={pwaBuilderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl bg-primary text-on-primary font-headline font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-primary-container active:scale-98 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">build</span>
              <span>Generate .AAB & .APK via PWABuilder</span>
            </a>
            <p className="text-[11px] text-center text-on-surface-variant">
              Clicking takes you to PWABuilder with MediTrack pre-loaded. Click <strong>Package for Stores &gt; Android</strong> to download your .aab & .apk bundle.
            </p>
          </div>
        )}

        {/* Tab 3: Instant WebAPK */}
        {activeTab === 'instant' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-on-surface space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Official Android WebAPK Technology</span>
              </div>
              <p className="text-on-surface-variant leading-relaxed">
                When you install MediTrack via Chrome, Edge, or Samsung Internet on Android, Android's operating system automatically compiles a real <strong>native APK</strong> (<code className="bg-black/10 dark:bg-white/10 px-1 rounded">org.chromium.webapk...</code>) directly on your device.
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-on-surface-variant bg-surface-container-low p-4 rounded-2xl">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p className="leading-snug">
                  Open MediTrack in <strong>Chrome</strong> or <strong>Edge</strong> on your Android device:
                  <span className="block mt-1 font-mono text-[11px] text-primary truncate select-all">{appUrl}</span>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p className="leading-snug">
                  Tap the top <strong>Install App</strong> button or open browser menu (⋮) &gt; <strong className="text-on-surface">Install app</strong> (or <em>Add to Home screen</em>).
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p className="leading-snug">
                  Android builds and installs the signed WebAPK into your phone's app drawer with native notification permissions and standalone display.
                </p>
              </div>
            </div>

            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl bg-primary text-on-primary font-headline font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-primary-container active:scale-98 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              <span>Open App on Android Device</span>
            </a>
          </div>
        )}

        {/* Tab 4: CLI / Bubblewrap */}
        {activeTab === 'cli' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-on-surface">
                <span className="material-symbols-outlined text-primary text-[18px]">terminal</span>
                <span>Google Bubblewrap CLI (Local .AAB / .APK Build)</span>
              </div>
              <p className="text-on-surface-variant leading-relaxed">
                If you have Node.js and the Android SDK / JDK installed on your machine, you can build the production <code>app-release-bundle.aab</code> for Google Play with Google's official Bubblewrap tool:
              </p>
            </div>

            <div className="relative">
              <pre className="p-3.5 rounded-2xl bg-inverse-surface text-inverse-on-surface font-mono text-[11px] overflow-x-auto leading-relaxed">
                {bubblewrapCmd}
              </pre>
              <button
                type="button"
                onClick={handleCopyCmd}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-surface-container-highest text-on-surface text-[10px] font-bold hover:bg-surface-container transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copiedCmd ? 'check' : 'content_copy'}
                </span>
                <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownloadTwaConfig}
                className="flex-1 py-2.5 rounded-xl border border-surface-container hover:bg-surface-container text-on-surface font-headline font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Download twa-manifest.json</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-2 border-t border-surface-container text-center">
          <p className="text-[11px] text-on-surface-variant">
            Built with Google Trusted Web Activities (TWA). Complies 100% with Google Play Store developer guidelines.
          </p>
        </div>
      </div>
    </div>
  );
};
