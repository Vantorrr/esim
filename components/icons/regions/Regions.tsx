import React from 'react';

export const GlobalIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" {...props}>
    <defs>
      <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#4F9BFF" />
        <stop offset="100%" stopColor="#7AE1FF" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="28" fill="url(#g1)" />
    <path d="M10 32h44M32 10v44M18 18c8 6 20 6 28 0M18 46c8-6 20-6 28 0" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round"/>
  </svg>
);

export const EuropeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" {...props}>
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#4F9BFF"/>
    <circle cx="20" cy="24" r="3" fill="#fff"/>
    <circle cx="28" cy="28" r="3" fill="#fff"/>
    <circle cx="36" cy="24" r="3" fill="#fff"/>
    <circle cx="44" cy="28" r="3" fill="#fff"/>
    <circle cx="24" cy="36" r="3" fill="#fff"/>
    <circle cx="32" cy="40" r="3" fill="#fff"/>
    <circle cx="40" cy="36" r="3" fill="#fff"/>
  </svg>
);

export const AsiaIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" {...props}>
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#7AE1FF"/>
    <path d="M16 40c10-8 22-8 32 0" stroke="#0A66FF" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M20 28c6-5 18-5 24 0" stroke="#0A66FF" strokeWidth="3" fill="none" strokeLinecap="round"/>
  </svg>
);

export const AmericasIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" {...props}>
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#2EC5FF"/>
    <path d="M22 18l8 6-6 6 6 6-8 6" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M42 18l-8 6 6 6-6 6 8 6" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round"/>
  </svg>
);

export const AfricaIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" {...props}>
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#0A66FF"/>
    <path d="M20 44c6-10 18-14 24-24" stroke="#7AE1FF" strokeWidth="4" fill="none" strokeLinecap="round"/>
  </svg>
);

export const MiddleEastIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" {...props}>
    <rect x="6" y="6" width="52" height="52" rx="14" fill="#0063E5"/>
    <path d="M22 42h20M22 34h20M22 26h20" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"/>
    <path d="M22 22c4-6 16-6 20 0" stroke="#7AE1FF" strokeWidth="3" fill="none"/>
  </svg>
);

export const RegionIconMap: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  'global': GlobalIcon,
  'europe': EuropeIcon,
  'asia': AsiaIcon,
  'americas': AmericasIcon,
  'africa': AfricaIcon,
  'middle-east': MiddleEastIcon,
};

export default RegionIconMap;
