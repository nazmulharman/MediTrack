import React from 'react';

export type LogoColorScheme = 'default' | 'aurora' | 'clinical' | 'midnight';

export interface SmartLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  variant?: 'icon' | 'horizontal' | 'badge';
  colorScheme?: LogoColorScheme;
  showBeacon?: boolean;
  pulseAnimated?: boolean;
  className?: string;
  onClick?: () => void;
  title?: string;
  subtitle?: string;
}

export const SmartLogo: React.FC<SmartLogoProps> = ({
  size = 'md',
  variant = 'icon',
  colorScheme = 'default',
  showBeacon = true,
  pulseAnimated = true,
  className = '',
  onClick,
  title = 'MediTrack',
  subtitle = 'Smart Dosage & Vault',
}) => {
  // Dimension calculation
  const getPixelSize = (): number => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'xs':
        return 26;
      case 'sm':
        return 34;
      case 'md':
        return 42;
      case 'lg':
        return 56;
      case 'xl':
        return 88;
      case '2xl':
        return 132;
      default:
        return 42;
    }
  };

  const px = getPixelSize();

  // Color theme definitions
  const themes = {
    default: {
      bgGradStart: '#041d1a',
      bgGradMid: '#062924',
      bgGradEnd: '#0a3a40',
      borderGradStart: '#26f5d8',
      borderGradEnd: '#0ea5e9',
      glow: '#00F5D4',
      pillTopStart: '#00F5D4',
      pillTopEnd: '#00A896',
      pillBottomStart: '#0284C7',
      pillBottomEnd: '#3B82F6',
      pulseStart: '#5EEAD4',
      pulseEnd: '#38BDF8',
      beacon: '#2DD4BF',
      haloOpacity: 0.18,
    },
    aurora: {
      bgGradStart: '#0F172A',
      bgGradMid: '#1E1B4B',
      bgGradEnd: '#311042',
      borderGradStart: '#A855F7',
      borderGradEnd: '#38BDF8',
      glow: '#818CF8',
      pillTopStart: '#C084FC',
      pillTopEnd: '#7C3AED',
      pillBottomStart: '#38BDF8',
      pillBottomEnd: '#2563EB',
      pulseStart: '#E879F9',
      pulseEnd: '#67E8F9',
      beacon: '#C084FC',
      haloOpacity: 0.22,
    },
    clinical: {
      bgGradStart: '#F0FDFA',
      bgGradMid: '#E0F2FE',
      bgGradEnd: '#CCFBF1',
      borderGradStart: '#0D9488',
      borderGradEnd: '#0284C7',
      glow: '#0D9488',
      pillTopStart: '#0D9488',
      pillTopEnd: '#042F2E',
      pillBottomStart: '#0284C7',
      pillBottomEnd: '#1E3A8A',
      pulseStart: '#0F766E',
      pulseEnd: '#0369A1',
      beacon: '#0D9488',
      haloOpacity: 0.12,
    },
    midnight: {
      bgGradStart: '#020617',
      bgGradMid: '#0B0F19',
      bgGradEnd: '#021820',
      borderGradStart: '#00F5D4',
      borderGradEnd: '#0066FF',
      glow: '#00F5D4',
      pillTopStart: '#00FFCC',
      pillTopEnd: '#00997B',
      pillBottomStart: '#0080FF',
      pillBottomEnd: '#111827',
      pulseStart: '#00FFCC',
      pulseEnd: '#60A5FA',
      beacon: '#00FFCC',
      haloOpacity: 0.25,
    },
  };

  const t = themes[colorScheme] || themes.default;
  const uniqueId = `smart-logo-${colorScheme}`;

  const renderSvgEmblem = () => (
    <svg
      viewBox="0 0 120 120"
      width={px}
      height={px}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 select-none drop-shadow-md transition-transform duration-300 group-hover:scale-105"
      role="img"
      aria-label="MediTrack Smart Logo"
    >
      <defs>
        {/* Background container gradient */}
        <linearGradient id={`${uniqueId}-bg`} x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={t.bgGradStart} />
          <stop offset="50%" stopColor={t.bgGradMid} />
          <stop offset="100%" stopColor={t.bgGradEnd} />
        </linearGradient>

        {/* Squircle glass border gradient */}
        <linearGradient id={`${uniqueId}-border`} x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={t.borderGradStart} stopOpacity="0.85" />
          <stop offset="50%" stopColor={t.borderGradEnd} stopOpacity="0.4" />
          <stop offset="100%" stopColor={t.borderGradStart} stopOpacity="0.2" />
        </linearGradient>

        {/* Ambient radial halo */}
        <radialGradient id={`${uniqueId}-halo`} cx="60" cy="60" r="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={t.glow} stopOpacity={t.haloOpacity} />
          <stop offset="100%" stopColor={t.glow} stopOpacity="0" />
        </radialGradient>

        {/* Pill Top Cap Gradient */}
        <linearGradient id={`${uniqueId}-pill-top`} x1="38" y1="32" x2="68" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={t.pillTopStart} />
          <stop offset="100%" stopColor={t.pillTopEnd} />
        </linearGradient>

        {/* Pill Bottom Cap Gradient */}
        <linearGradient id={`${uniqueId}-pill-bottom`} x1="56" y1="58" x2="86" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={t.pillBottomStart} />
          <stop offset="100%" stopColor={t.pillBottomEnd} />
        </linearGradient>

        {/* Pill Metallic Joint Seam */}
        <linearGradient id={`${uniqueId}-seam`} x1="42" y1="52" x2="78" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#E2E8F0" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.4" />
        </linearGradient>

        {/* Pulse ECG rhythm gradient */}
        <linearGradient id={`${uniqueId}-pulse`} x1="20" y1="60" x2="100" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={t.pulseStart} />
          <stop offset="50%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor={t.pulseEnd} />
        </linearGradient>

        {/* Pill Specular Glass Highlight */}
        <linearGradient id={`${uniqueId}-specular`} x1="40" y1="36" x2="52" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Neon Soft Glow Filter */}
        <filter id={`${uniqueId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer Squircle Container */}
      <rect
        x="6"
        y="6"
        width="108"
        height="108"
        rx="28"
        fill={`url(#${uniqueId}-bg)`}
        stroke={`url(#${uniqueId}-border)`}
        strokeWidth="2"
      />

      {/* Ambient Radial Aura */}
      <circle cx="60" cy="60" r="50" fill={`url(#${uniqueId}-halo)`} />

      {/* Orbit / Smart Schedule Dial Arc */}
      <circle
        cx="60"
        cy="60"
        r="44"
        stroke={t.borderGradStart}
        strokeOpacity="0.16"
        strokeWidth="1.2"
        strokeDasharray="4 6"
      />

      {/* Protective Health Shield Contour Subtle */}
      <path
        d="M60 21C74 21 89 25 89 36C89 62 76 83 60 97C44 83 31 62 31 36C31 25 46 21 60 21Z"
        fill="none"
        stroke={t.borderGradStart}
        strokeOpacity="0.12"
        strokeWidth="1.5"
      />

      {/* 3D Smart Capsule Pill (Group rotated -35 deg centered at 60,60) */}
      <g transform="rotate(-35 60 60)">
        {/* Capsule Shadow */}
        <rect
          x="44"
          y="27"
          width="32"
          height="66"
          rx="16"
          fill="#000000"
          fillOpacity="0.3"
          filter={`url(#${uniqueId}-glow)`}
          transform="translate(2, 4)"
        />

        {/* Lower Half of Capsule (Cobalt / Cyan) */}
        <path
          d="M44 60H76V77C76 85.8366 68.8366 93 60 93C51.1634 93 44 85.8366 44 77V60Z"
          fill={`url(#${uniqueId}-pill-bottom)`}
        />

        {/* Upper Half of Capsule (Emerald / Teal) */}
        <path
          d="M44 43C44 34.1634 51.1634 27 60 27C68.8366 27 76 34.1634 76 43V60H44V43Z"
          fill={`url(#${uniqueId}-pill-top)`}
        />

        {/* Metallic Seam Ring dividing the capsule */}
        <rect
          x="43.5"
          y="58"
          width="33"
          height="4"
          rx="1"
          fill={`url(#${uniqueId}-seam)`}
          stroke="#FFFFFF"
          strokeOpacity="0.4"
          strokeWidth="0.5"
        />

        {/* Pill Glass Gloss Highlight */}
        <path
          d="M48 35C48 31 51 29 55 29C56.5 29 57 32 57 37V81C57 85 55 86 53 85C49.5 83 48 78 48 74V35Z"
          fill={`url(#${uniqueId}-specular)`}
        />

        {/* Smart Pill Dose Division Micro-Ticks */}
        <line x1="57" y1="42" x2="63" y2="42" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1" strokeLinecap="round" />
        <line x1="57" y1="78" x2="63" y2="78" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1" strokeLinecap="round" />
      </g>

      {/* Smart Telemetry / Pulse Heartbeat Wave (ECG / Schedule Rhythm) */}
      <path
        d="M20 64H36L42 56L48 72L56 38L65 78L73 54L79 64H100"
        stroke={`url(#${uniqueId}-pulse)`}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${uniqueId}-glow)`}
      />

      {/* Connected Smart Telemetry Nodes (Data points along rhythm) */}
      <circle cx="36" cy="64" r="2" fill="#FFFFFF" opacity="0.9" />
      <circle cx="56" cy="38" r="3" fill="#FFFFFF" filter={`url(#${uniqueId}-glow)`} />
      <circle cx="73" cy="54" r="2.2" fill="#FFFFFF" opacity="0.9" />

      {/* Active Sync Beacon at endpoint (Pulse transmitter) */}
      {showBeacon && (
        <g>
          {/* Animated beacon ring */}
          <circle
            cx="100"
            cy="64"
            r="5"
            fill="none"
            stroke={t.beacon}
            strokeWidth="1.5"
            opacity="0.8"
            className={pulseAnimated ? 'animate-ping origin-center' : ''}
          />
          {/* Center Beacon Core */}
          <circle
            cx="100"
            cy="64"
            r="3.5"
            fill={t.beacon}
            filter={`url(#${uniqueId}-glow)`}
          />
          <circle cx="100" cy="64" r="1.5" fill="#FFFFFF" />
        </g>
      )}

      {/* Smart Sparkle Node in upper right */}
      <path
        d="M93 25L94.5 29.5L99 31L94.5 32.5L93 37L91.5 32.5L87 31L91.5 29.5L93 25Z"
        fill="#FFFFFF"
        opacity="0.75"
      />
    </svg>
  );

  // Variant layouts
  if (variant === 'horizontal') {
    return (
      <div
        onClick={onClick}
        className={`group flex items-center gap-2.5 select-none ${
          onClick ? 'cursor-pointer hover:opacity-95' : ''
        } ${className}`}
      >
        <div className="relative flex items-center justify-center">
          {renderSvgEmblem()}
          {showBeacon && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-surface animate-pulse" />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-headline font-extrabold text-[17px] text-on-surface tracking-tight truncate leading-none">
              {title}
            </span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-primary-fixed/40 text-on-primary-fixed-variant text-[10px] font-bold shrink-0 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Smart
            </span>
          </div>
          <span className="text-[11px] font-medium text-on-surface-variant truncate mt-0.5">
            {subtitle}
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        onClick={onClick}
        className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-surface-container-low border border-primary/20 shadow-sm ${
          onClick ? 'cursor-pointer hover:bg-surface-container active:scale-98' : ''
        } ${className}`}
      >
        {renderSvgEmblem()}
        <div className="flex flex-col text-left">
          <span className="font-headline font-bold text-xs text-on-surface leading-tight">
            {title}
          </span>
          <span className="text-[10px] text-on-surface-variant font-medium">
            Active Dose Intelligence
          </span>
        </div>
      </div>
    );
  }

  // Default 'icon'
  return (
    <div
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      title={`${title} - Smart Medicine Tracker`}
    >
      {renderSvgEmblem()}
    </div>
  );
};
