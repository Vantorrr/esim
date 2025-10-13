import React from 'react';

const Badge: React.FC<{ children: React.ReactNode; color?: string } & React.SVGProps<SVGSVGElement>> = ({ children, color = '#4F9BFF', ...props }) => (
  <svg viewBox="0 0 64 64" {...props}>
    <defs>
      <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={color} />
        <stop offset="100%" stopColor="#7AE1FF" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="28" fill="url(#rg)"/>
    {children}
  </svg>
);

export const GlobalIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <Badge {...props}>
    {/* simplified globe meridians */}
    <path d="M10 32h44M32 10v44" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M18 20c8 5 20 5 28 0M18 44c8-5 20-5 28 0" stroke="#E6F6FF" strokeWidth="3" fill="none" strokeLinecap="round"/>
  </Badge>
);

export const EuropeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <Badge {...props} color="#3F8CFF">
    {/* Europe-like blob */}
    <path d="M22 40c-3-3-2-7 1-9 3-2 5-1 7-3 2-1 2-4 5-5 3-1 6 1 7 3 2 3 1 6-1 8-2 2-4 2-6 4-3 2-7 5-13 2z" fill="#fff" opacity="0.9"/>
  </Badge>
);

export const AsiaIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <Badge {...props} color="#2EC5FF">
    {/* Asia-like blob */}
    <path d="M18 34c2-6 8-10 15-11 6-1 13 2 13 7 0 4-3 6-6 7-3 1-5 1-8 3-4 3-9 3-14-1 0 0 0-3 0-5z" fill="#fff" opacity="0.9"/>
  </Badge>
);

export const AmericasIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <Badge {...props} color="#0A66FF">
    {/* North/South America shapes */}
    <path d="M25 18c3 1 5 3 5 5s-3 4-4 6c-2 2-2 4-1 6l-4 2c-2-3-2-6 0-9 1-2 2-4 0-6 0 0 2-4 4-4z" fill="#E6F6FF"/>
    <path d="M36 34c2 0 5 2 6 4 1 3-1 6-3 7-3 2-6 2-8 0-2-1-2-4 0-6 2-2 3-5 5-5z" fill="#fff" opacity="0.9"/>
  </Badge>
);

export const AfricaIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <Badge {...props} color="#1580FF">
    {/* Africa-like polygon */}
    <path d="M22 24l8-6 10 2 4 8-6 8-4 10-6-4 2-6-8-4z" fill="#fff" opacity="0.9"/>
  </Badge>
);

export const MiddleEastIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <Badge {...props} color="#0063E5">
    {/* Middle East peninsula-like shape */}
    <path d="M22 30c3-4 8-6 12-6 4 0 9 2 8 6-1 3-4 5-7 6-2 1-3 3-4 5l-6-2 2-5-5-4z" fill="#fff" opacity="0.9"/>
  </Badge>
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
