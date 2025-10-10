export default function EsimIcon({ className = "w-6 h-6", active = false }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Внешний контур глобуса */}
      <circle 
        cx="12" 
        cy="12" 
        r="9" 
        stroke="currentColor" 
        strokeWidth="2"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? "0.1" : "0"}
      />
      
      {/* Меридианы */}
      <path 
        d="M12 3a15.3 15.3 0 0 1 4 9 15.3 15.3 0 0 1-4 9 15.3 15.3 0 0 1-4-9 15.3 15.3 0 0 1 4-9z" 
        stroke="currentColor" 
        strokeWidth="2"
      />
      
      {/* Экватор */}
      <path 
        d="M3 12h18" 
        stroke="currentColor" 
        strokeWidth="2"
      />
      
      {/* SIM чип в центре */}
      <rect 
        x="9.5" 
        y="10" 
        width="5" 
        height="4" 
        rx="0.5" 
        stroke="currentColor" 
        strokeWidth="1.5"
        fill={active ? "currentColor" : "none"}
      />
      
      {/* Контакты чипа */}
      <path 
        d="M10.5 11.5h1M13.5 11.5h1M10.5 12.5h1M13.5 12.5h1" 
        stroke="currentColor" 
        strokeWidth="1" 
        strokeLinecap="round"
      />
    </svg>
  );
}

