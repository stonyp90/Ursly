/**
 * Ursly Logo - Clean, modern design inspired by macOS native apps
 *
 * A sleek, geometric design with a stylized "U" that represents
 * connectivity and cloud storage. Uses theme-aware colors.
 */

import './Logo.css';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 24, className = '' }: LogoProps) {
  const gradientId = `ursly-grad-${Math.random().toString(36).substr(2, 6)}`;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={`ursly-logo ${className}`}
      role="img"
      aria-label="Ursly Logo"
    >
      {/* Background - Subtle rounded square */}
      <rect width="24" height="24" rx="6" fill={`url(#${gradientId})`} />

      {/* Modern "U" with connected nodes - represents cloud connectivity */}
      <g className="logo-glyph">
        {/* Main U shape */}
        <path
          d="M7 6.5V13.5C7 16.5376 9.23858 19 12 19C14.7614 19 17 16.5376 17 13.5V6.5"
          stroke="white"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Top connection nodes */}
        <circle cx="7" cy="5.5" r="1.25" fill="white" opacity="0.9" />
        <circle cx="17" cy="5.5" r="1.25" fill="white" opacity="0.9" />
        {/* Bottom center node - data point */}
        <circle cx="12" cy="14" r="1.5" fill="white" />
      </g>

      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="24"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--primary, #0a84ff)" />
          <stop offset="1" stopColor="var(--secondary, #5e5ce6)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Logo with text variant
 */
export function LogoWithText({ size = 24, className = '' }: LogoProps) {
  return (
    <div className={`logo-with-text ${className}`}>
      <Logo size={size} />
      <div className="logo-text">
        <span className="logo-title">Ursly</span>
        <span className="logo-tagline">VIRTUAL FILE SYSTEM</span>
      </div>
    </div>
  );
}

/**
 * Minimal icon variant - just the glyph, no background
 */
export function LogoIcon({ size = 20, className = '' }: LogoProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={`ursly-logo-icon ${className}`}
      role="img"
      aria-label="Ursly"
    >
      <path
        d="M4 4V11C4 14.3137 6.68629 17 10 17C13.3137 17 16 14.3137 16 11V4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="4" cy="3" r="1.25" fill="currentColor" opacity="0.8" />
      <circle cx="16" cy="3" r="1.25" fill="currentColor" opacity="0.8" />
      <circle cx="10" cy="11" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default Logo;
