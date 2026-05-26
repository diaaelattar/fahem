import React from 'react'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | number
  variant?: 'horizontal' | 'vertical' | 'icon-only'
  light?: boolean
}

export function Logo({
  className = '',
  size = 'md',
  variant = 'horizontal',
  light = false,
}: LogoProps) {
  // Determine pixel sizes
  const getPixelSize = () => {
    if (typeof size === 'number') return size
    switch (size) {
      case 'sm':
        return 32
      case 'md':
        return 48
      case 'lg':
        return 64
      case 'xl':
        return 96
      default:
        return 48
    }
  }

  const pxSize = getPixelSize()

  // SVG Markup representing the premium wing and glowing book
  const logoIcon = (
    <svg
      width={pxSize}
      height={pxSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-pop shrink-0 select-none drop-shadow-[0_4px_12px_rgba(27,79,114,0.15)]"
    >
      <defs>
        {/* Egypt Blue Gradient */}
        <linearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1B4F72" />
          <stop offset="50%" stopColor="#2E86C1" />
          <stop offset="100%" stopColor="#1A5276" />
        </linearGradient>

        {/* Egypt Gold Gradient */}
        <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C5A028" />
          <stop offset="50%" stopColor="#F0C040" />
          <stop offset="100%" stopColor="#B8960C" />
        </linearGradient>

        {/* Glow Filter */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Hexagonal Shield - Premium Outline */}
      <polygon
        points="50,5 90,28 90,72 50,95 10,72 10,28"
        stroke="url(#blueGrad)"
        strokeWidth="3.5"
        strokeLinejoin="round"
        fill={light ? 'rgba(255,255,255,0.85)' : 'rgba(27,79,114,0.03)'}
        className="transition-all duration-300"
      />

      {/* Stylized Pages of a Book (Base) */}
      <path
        d="M25 65 C 38 60, 50 63, 50 63 C 50 63, 62 60, 75 65 V 45 C 62 40, 50 43, 50 43 C 50 43, 38 40, 25 45 Z"
        fill="url(#blueGrad)"
        opacity="0.95"
      />
      <path
        d="M25 68 C 38 63, 50 66, 50 66 C 50 66, 62 63, 75 68 V 65 C 62 60, 50 63, 50 63 C 50 63, 38 60, 25 65 Z"
        fill="url(#goldGrad)"
        opacity="0.85"
      />

      {/* Glowing Golden Wing of Preemption (استباق) - Rising from center of the book */}
      <path
        d="M50 35 C 53 25, 68 18, 80 18 C 72 28, 64 35, 52 48 C 65 42, 75 39, 82 40 C 70 48, 60 55, 48 65 C 55 58, 65 56, 72 57 C 58 66, 48 72, 38 78 C 42 66, 46 54, 50 35 Z"
        fill="url(#goldGrad)"
        filter="url(#glow)"
      />

      {/* Center Intelligence Core */}
      <circle
        cx="50"
        cy="50"
        r="4.5"
        fill="#FFFFFF"
        className="animate-pulse shadow-xl"
      />
    </svg>
  )

  if (variant === 'icon-only') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {logoIcon}
      </div>
    )
  }

  // Text colors
  const titleColor = light ? 'text-white' : 'text-slate-800'
  const subtextColor = light ? 'text-amber-300' : 'text-amber-600'

  if (variant === 'vertical') {
    return (
      <div
        className={`flex flex-col items-center gap-2.5 text-center ${className}`}
      >
        {logoIcon}
        <div className="flex flex-col items-center">
          <span
            className={`font-display text-2xl font-black leading-none tracking-tight ${titleColor}`}
          >
            استباق مصر
          </span>
          <span
            className={`mt-1 text-xs font-semibold uppercase tracking-widest ${subtextColor}`}
          >
            فاهم
          </span>
        </div>
      </div>
    )
  }

  // Default: Horizontal
  return (
    <div className={`inline-flex items-center gap-3.5 ${className}`}>
      {logoIcon}
      <div className="flex flex-col justify-center text-right">
        <span
          className={`font-display text-xl font-black leading-none tracking-tight ${titleColor}`}
        >
          استباق مصر
        </span>
        <span
          className={`mt-1.5 text-[10px] font-bold uppercase leading-none tracking-widest ${subtextColor}`}
        >
          فـــاهـــم
        </span>
      </div>
    </div>
  )
}
