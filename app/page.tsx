'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { initTelegramSDK } from '@/lib/telegram';
import Header from '@/components/Header';
import CountrySelector from '@/components/CountrySelector';
import PackageList from '@/components/PackageList';
import Footer from '@/components/Footer';
import LoadingScreen from '@/components/LoadingScreen';
import BottomNav from '@/components/BottomNav';
import PhoneIcon from '@/components/icons/PhoneIcon';
import DollarIcon from '@/components/icons/DollarIcon';
import GlobeIcon from '@/components/icons/GlobeIcon';

export default function Home() {
  const [isReady, setIsReady] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  useEffect(() => {
    initTelegramSDK();
    // Даём время на загрузку
    setTimeout(() => {
      setIsReady(true);
    }, 100);
  }, []);

  if (showLoading) {
    return <LoadingScreen onFinish={() => setShowLoading(false)} />;
  }


  return (
    <main className="min-h-screen bg-background pb-20">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-primary text-white py-12 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-wave opacity-30 rounded-full blur-3xl animate-wave"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="mb-6 inline-block p-4 bg-white/10 backdrop-blur-md rounded-3xl">
            <div className="w-16 h-16 relative">
              <Image
                src="/logo.png"
                alt="eWave"
                width={64}
                height={64}
                className="drop-shadow-lg"
                priority
              />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-3">
            eSIM для путешествий
          </h1>
          <p className="text-xl opacity-90 mb-8">
            Интернет в любой точке мира за минуту
          </p>
          
          <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="w-10 h-10 mx-auto mb-2 text-white">
                <PhoneIcon className="w-10 h-10" />
              </div>
              <p className="text-sm font-medium">Мгновенная активация</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="w-10 h-10 mx-auto mb-2 text-white">
                <DollarIcon className="w-10 h-10" />
              </div>
              <p className="text-sm font-medium">Лучшие цены</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="w-10 h-10 mx-auto mb-2 text-white">
                <GlobeIcon className="w-10 h-10" />
              </div>
              <p className="text-sm font-medium">200+ стран</p>
            </div>
          </div>
        </div>
      </section>

      {/* Country Selector */}
      <section className="py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <CountrySelector 
            selectedCountry={selectedCountry}
            onSelectCountry={setSelectedCountry}
          />
        </div>
      </section>

      {/* Package List */}
      <section className="pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <PackageList country={selectedCountry} />
        </div>
      </section>

      <Footer />
      
      <BottomNav />
    </main>
  );
}

