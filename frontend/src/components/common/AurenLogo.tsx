import React from 'react';

interface AurenLogoProps {
  size?: number;
  className?: string;
  variant?: 'full' | 'icon' | 'mark' | 'monochrome';
  animated?: boolean;
  theme?: 'luxury' | 'white' | 'dark' | 'copper';
}

export const AurenLogo: React.FC<AurenLogoProps> = ({
  size = 36,
  className = '',
  variant = 'full',
  animated = false,
  theme = 'luxury',
}) => {
  // Unique SVG IDs to avoid collisions when multiple logos are on page
  const gradientId = `aurenGrad_${Math.random().toString(36).substring(2, 7)}`;
  const filterId = `aurenGlow_${Math.random().toString(36).substring(2, 7)}`;

  // Exact geometric SVG path of the stylized modern "A" monogram
  const aurenPathD = `
    M 21.5 74
    L 34.5 74
    L 67.2 41.3
    A 4.2 4.2 0 0 1 71.2 44.8
    L 71.2 65.2
    L 62.2 59.2
    A 4.2 4.2 0 0 0 54.8 63.5
    L 54.8 67.8
    A 6.2 6.2 0 0 0 61 74
    L 72.8 74
    A 6.2 6.2 0 0 0 79 67.8
    L 79 38.5
    A 11.5 11.5 0 0 0 67.5 27
    L 21.5 73
    Z
  `;

  const isPureMark = variant === 'mark' || variant === 'monochrome';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Official Auren Emblem SVG */}
      <div
        className={`relative flex items-center justify-center transition-transform duration-300 ${
          animated ? 'animate-auren-glow' : 'hover:scale-105'
        }`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Auren Signature Luxury Copper / Gold Metallic Gradient */}
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FAF8F5" />
              <stop offset="25%" stopColor="#DFB59D" />
              <stop offset="65%" stopColor="#C5855A" />
              <stop offset="100%" stopColor="#8E5633" />
            </linearGradient>

            {/* Obsidian Core Background Gradient */}
            <linearGradient id={`${gradientId}_bg`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#252220" />
              <stop offset="100%" stopColor="#121110" />
            </linearGradient>

            {/* Subtle Metallic Glow Filter */}
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Optional Obsidian Squircle Badge Container */}
          {!isPureMark && (
            <rect
              x="5"
              y="5"
              width="90"
              height="90"
              rx="24"
              fill={`url(#${gradientId}_bg)`}
              stroke={theme === 'luxury' ? `url(#${gradientId})` : '#332F2B'}
              strokeWidth="1.8"
              className="transition-colors duration-300"
            />
          )}

          {/* Primary Stylized 'A' Geometric Glyph */}
          <path
            d={aurenPathD}
            fill={
              variant === 'monochrome'
                ? '#FFFFFF'
                : theme === 'white'
                ? '#FAF8F5'
                : `url(#${gradientId})`
            }
            stroke={animated ? `url(#${gradientId})` : 'none'}
            strokeWidth={animated ? '1' : '0'}
            className={animated ? 'animate-auren-draw' : ''}
            filter={theme === 'luxury' && !isPureMark ? `url(#${filterId})` : undefined}
          />
        </svg>
      </div>

      {/* Brand Typography */}
      {variant === 'full' && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-display text-sm sm:text-base font-bold tracking-[0.2em] sm:tracking-[0.28em] text-[#1C1917] uppercase">
              AUREN
            </span>
            <span className="hidden sm:inline rounded-full bg-[#F5E9DF] px-2 py-0.5 text-[9px] font-bold text-[#8E5633] border border-[#DFB59D]/70 tracking-widest uppercase">
              AI OPS
            </span>
          </div>
          <span className="hidden md:inline text-[10px] text-[#78716C] tracking-wide -mt-0.5">
            Autonomous Operations Matrix
          </span>
        </div>
      )}
    </div>
  );
};
