'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface LoadingScreenProps {
  onFinish?: () => void;
}

export default function LoadingScreen({ onFinish }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Симулируем загрузку
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsVisible(false);
            onFinish?.();
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-primary overflow-hidden">
      {/* Animated waves background */}
      <div className="absolute inset-0 opacity-20">
        <div className="wave wave-1"></div>
        <div className="wave wave-2"></div>
        <div className="wave wave-3"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 animate-fade-in">
        {/* Logo with pulse animation */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-secondary rounded-3xl blur-2xl opacity-50 animate-pulse-slow"></div>
          <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
            <div className="relative w-32 h-32 animate-bounce-slow">
              <Image
                src="/logo.png"
                alt="eWave Logo"
                width={128}
                height={128}
                className="drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>

        {/* Brand name */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold text-white drop-shadow-lg animate-slide-up">
            eWave
          </h1>
          <p className="text-xl text-white/90 font-light animate-slide-up animation-delay-200">
            eSIM для путешествий
          </p>
        </div>

        {/* Loading bar */}
        <div className="w-64 space-y-3 animate-slide-up animation-delay-400">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-secondary via-yellow-400 to-secondary rounded-full transition-all duration-300 ease-out shadow-lg"
              style={{ width: `${progress}%` }}
            >
              <div className="h-full w-full bg-white/30 animate-shimmer"></div>
            </div>
          </div>
          <div className="flex justify-between text-sm text-white/80">
            <span>Загрузка...</span>
            <span className="font-mono font-bold">{progress}%</span>
          </div>
        </div>

        {/* Features icons */}
        <div className="flex gap-6 mt-4 animate-slide-up animation-delay-600">
          <div className="flex flex-col items-center gap-2 text-white/80">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-2xl border border-white/20">
              ⚡
            </div>
            <span className="text-xs">Быстро</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-white/80">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-2xl border border-white/20">
              🌍
            </div>
            <span className="text-xs">200+ стран</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-white/80">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-2xl border border-white/20">
              🔒
            </div>
            <span className="text-xs">Безопасно</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .wave {
          position: absolute;
          bottom: -50px;
          width: 200%;
          height: 300px;
          background: linear-gradient(180deg, transparent, rgba(255, 133, 52, 0.3));
          border-radius: 50%;
          animation: wave-animation 10s infinite ease-in-out;
        }

        .wave-1 {
          left: -50%;
          animation-delay: 0s;
        }

        .wave-2 {
          left: -30%;
          animation-delay: 2s;
          opacity: 0.7;
        }

        .wave-3 {
          left: -60%;
          animation-delay: 4s;
          opacity: 0.5;
        }

        @keyframes wave-animation {
          0%, 100% {
            transform: translateX(0) translateY(0) rotate(0deg);
          }
          50% {
            transform: translateX(20px) translateY(-20px) rotate(5deg);
          }
        }

        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
          animation: float-up linear infinite;
          opacity: 0;
        }

        @keyframes float-up {
          0% {
            transform: translateY(100vh) scale(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) scale(1);
            opacity: 0;
          }
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.05);
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
          animation-fill-mode: forwards;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
          animation-fill-mode: forwards;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
          opacity: 0;
          animation-fill-mode: forwards;
        }

        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

