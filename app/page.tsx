'use client';

import { useEffect, useState } from 'react';
import { initTelegramSDK } from '@/lib/telegram';
import Header from '@/components/Header';
import CountrySelector from '@/components/CountrySelector';
import PackageList from '@/components/PackageList';
import Footer from '@/components/Footer';
import LoadingScreen from '@/components/LoadingScreen';
import BottomNav from '@/components/BottomNav';

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
    <main className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-primary text-white py-12 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-wave opacity-30 rounded-full blur-3xl animate-wave"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="text-6xl mb-4 animate-wave">✈️</div>
          <h1 className="text-4xl font-bold mb-4">
            eSIM для путешествий
          </h1>
          <p className="text-xl opacity-90 mb-6">
            Интернет в любой точке мира за минуту
          </p>
          <div className="flex gap-4 justify-center text-sm">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              📱 Мгновенная активация
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              💰 Лучшие цены
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              🌍 200+ стран
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

