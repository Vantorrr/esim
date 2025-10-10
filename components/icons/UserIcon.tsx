export default function UserIcon({ className = "w-6 h-6", active = false }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill={active ? "currentColor" : "none"} opacity={active ? "0.2" : "1"}/>
      <path 
        d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
        fill={active ? "currentColor" : "none"}
        opacity={active ? "0.2" : "1"}
      />
    </svg>
  );
}

