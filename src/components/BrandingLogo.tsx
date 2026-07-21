import React from "react";

// Jtech Solution's official vector logo matching the user's visual identity
export function JtechLogo({ size = "md", showText = true }: { size?: "sm" | "md" | "lg"; showText?: boolean }) {
  const iconSize = size === "sm" ? "w-4 h-5" : size === "lg" ? "w-7 h-9" : "w-5 h-6";
  const textSize = size === "sm" ? "text-[10px]" : size === "lg" ? "text-sm" : "text-xs";

  return (
    <div className="flex items-center gap-2 font-sans shrink-0 max-w-full">
      <div className={`${iconSize} flex flex-col items-center justify-center relative shrink-0`}>
        {/* Signal arcs in vibrant red */}
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xs" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top Red Signal Arcs */}
          <path d="M 25 22 A 32 32 0 0 1 75 22" stroke="#DC2626" strokeWidth="9" strokeLinecap="round" />
          <path d="M 35 32 A 20 20 0 0 1 65 32" stroke="#DC2626" strokeWidth="9" strokeLinecap="round" />
          <circle cx="50" cy="42" r="5" fill="#DC2626" />

          {/* Main Blue Stylized 'J' Lettermark */}
          <path
            d="M 45 48 L 65 43 C 65 43 65 65 60 78 C 50 102 20 115 15 90 C 12 75 28 65 42 62 C 45 61 45 75 42 85 C 38 92 28 95 25 85 C 23 78 35 72 45 70 Z"
            fill="url(#jtech-grad)"
          />

          <defs>
            <linearGradient id="jtech-grad" x1="15" y1="43" x2="65" y2="115" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0F172A" />
              <stop offset="0.5" stopColor="#1E3A8A" />
              <stop offset="1" stopColor="#0284C7" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="leading-tight text-left min-w-0">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium block truncate">POWERED &</span>
          <span className={`${textSize} font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-1 flex-wrap`}>
            Developed by <span className="text-indigo-600 dark:text-indigo-400 font-extrabold whitespace-nowrap">Jtech Solution's</span>
          </span>
        </div>
      )}
    </div>
  );
}

// Custom AI Recruiter Pro Vector App Logo
export function AppLogo({ size = "md", layout = "horizontal" }: { size?: "sm" | "md" | "lg"; layout?: "horizontal" | "vertical" }) {
  const iconBox = size === "sm" ? "w-7 h-7 p-1.5" : size === "lg" ? "w-12 h-12 p-2.5" : "w-9 h-9 p-2";
  const iconSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-7 h-7" : "w-5 h-5";
  const titleSize = size === "sm" ? "text-xs" : size === "lg" ? "text-xl" : "text-sm";

  return (
    <div className={`flex ${layout === "vertical" ? "flex-col items-center text-center gap-2" : "items-center gap-2.5"} font-sans cursor-pointer min-w-0`}>
      <div className={`${iconBox} bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 text-white rounded-xl shadow-md shadow-indigo-600/25 flex items-center justify-center shrink-0 border border-indigo-400/30 relative overflow-hidden group`}>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition duration-300" />
        
        {/* Stylized AI Recruit Icon */}
        <svg viewBox="0 0 24 24" className={`${iconSize} fill-none stroke-current stroke-[2]`} strokeLinecap="round" strokeLinejoin="round">
          {/* AI Brain + Person silhouette */}
          <path d="M12 2a4 4 0 0 0-4 4v1a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z" />
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
          <circle cx="12" cy="7" r="1" fill="currentColor" />
          <path d="M18 8l3-2" />
          <path d="M6 8L3 6" />
          <path d="M12 2v2" />
        </svg>
      </div>

      <div className="leading-tight min-w-0">
        <h1 className={`${titleSize} font-black tracking-wider uppercase text-slate-900 dark:text-white font-display flex items-center gap-1.5 whitespace-nowrap`}>
          AI Recruiter <span className="text-indigo-600 dark:text-indigo-400">Pro</span>
        </h1>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-tight truncate">
          Multi-Agent Talent Intelligence
        </p>
      </div>
    </div>
  );
}

// Compact Banner Combining Both Logos
export function JtechBrandBanner({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl border border-indigo-500/20 shadow-xs ${className}`}>
      <JtechLogo size="sm" showText={false} />
      <span className="text-[11px] font-medium text-slate-300">
        Developed by <strong className="text-white font-bold">Jtech Solution's</strong>
      </span>
    </div>
  );
}
