export default function EsimIcon({ className = "w-6 h-6", active = false }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path 
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" 
        fill={active ? "currentColor" : "currentColor"}
        opacity={active ? "1" : "0.6"}
      />
      <rect x="7" y="9" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M9 11h2M9 13h2M13 11h2M13 13h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

