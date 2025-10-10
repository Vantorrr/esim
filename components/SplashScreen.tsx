'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-primary">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="splash-wave splash-wave-1"></div>
        <div className="splash-wave splash-wave-2"></div>
        <div className="splash-wave splash-wave-3"></div>
      </div>

      {/* Logo */}
      <div className="relative z-10 animate-splash-logo">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-secondary rounded-full blur-3xl opacity-60 animate-pulse"></div>
          <Image
            src="/logo.png"
            alt="eWave"
            width={180}
            height={180}
            className="relative drop-shadow-2xl"
            priority
          />
        </div>
      </div>

      <style jsx>{`
        .splash-wave {
          position: absolute;
          width: 200%;
          height: 200%;
          background: radial-gradient(
            circle,
            rgba(255, 133, 52, 0.3) 0%,
            transparent 70%
          );
          border-radius: 50%;
          animation: splash-wave-animation 3s ease-out infinite;
        }

        .splash-wave-1 {
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 0s;
        }

        .splash-wave-2 {
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 0.5s;
          opacity: 0.7;
        }

        .splash-wave-3 {
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 1s;
          opacity: 0.5;
        }

        @keyframes splash-wave-animation {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }

        .animate-splash-logo {
          animation: splash-logo 2.5s ease-out;
        }

        @keyframes splash-logo {
          0% {
            opacity: 0;
            transform: scale(0.5) rotate(-10deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.1) rotate(5deg);
          }
          70% {
            transform: scale(0.95) rotate(-2deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
      `}</style>
    </div>
  );
}

