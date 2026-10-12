import "./MatchIllustration.css";

// Un diente conecta a estudiante y paciente. Pensada para fondos oscuros.
export default function MatchIllustration({ className = "" }) {
  const star = "M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z";
  return (
    <svg className={`dm-illus ${className}`} viewBox="0 0 340 280" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="dmTooth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#bae6fd" /></linearGradient>
        <radialGradient id="dmGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#06b6d4" stopOpacity="0.55" /><stop offset="1" stopColor="#06b6d4" stopOpacity="0" /></radialGradient>
        <linearGradient id="dmHeart" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f472b6" /><stop offset="1" stopColor="#fb7185" /></linearGradient>
        <linearGradient id="dmCap" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#38bdf8" /><stop offset="1" stopColor="#6366f1" /></linearGradient>
        <linearGradient id="dmArc" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#67e8f9" /><stop offset="1" stopColor="#c4b5fd" /></linearGradient>
      </defs>
      <circle cx="170" cy="140" r="132" fill="url(#dmGlow)" />
      <circle cx="170" cy="140" r="120" fill="none" stroke="rgba(255,255,255,0.16)" strokeDasharray="2 7" strokeLinecap="round" />
      <circle cx="170" cy="140" r="86" fill="none" stroke="rgba(255,255,255,0.18)" />
      <path className="dm-illus-arc" d="M62 76 C 120 14, 246 24, 284 196" fill="none" stroke="url(#dmArc)" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 8" />

      <g transform="translate(120 84)">
        <g className="dm-illus-tooth">
          <path d="M50 8 C 36 0, 14 4, 10 26 C 7 42, 15 52, 17 68 C 19 86, 20 112, 31 112 C 40 112, 41 86, 50 86 C 59 86, 60 112, 69 112 C 80 112, 81 86, 83 68 C 85 52, 93 42, 90 26 C 86 4, 64 0, 50 8 Z" fill="url(#dmTooth)" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
          <path d="M24 24 C 27 16, 36 12, 43 15" fill="none" stroke="#ffffff" strokeOpacity="0.9" strokeWidth="4" strokeLinecap="round" />
        </g>
      </g>

      <g transform="translate(30 46)">
        <g className="dm-illus-chip dm-illus-chip--a">
          <rect width="58" height="58" rx="18" fill="url(#dmCap)" />
          <g transform="translate(15 15) scale(1.17)" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /></g>
        </g>
      </g>
      <g transform="translate(254 178)">
        <g className="dm-illus-chip dm-illus-chip--b">
          <rect width="58" height="58" rx="18" fill="url(#dmHeart)" />
          <g transform="translate(15 15) scale(1.17)" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></g>
        </g>
      </g>

      <path className="dm-illus-star dm-illus-star--a" d={star} transform="translate(262 62)" fill="#67e8f9" />
      <path className="dm-illus-star dm-illus-star--b" d={star} transform="translate(92 214) scale(0.75)" fill="#ffffff" />
      <path className="dm-illus-star dm-illus-star--c" d={star} transform="translate(300 118) scale(0.6)" fill="#a5b4fc" />
    </svg>
  );
}
