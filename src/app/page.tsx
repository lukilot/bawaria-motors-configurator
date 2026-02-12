import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getAvailableCars } from '@/lib/stock-fetch';
import { getAllDictionaries } from '@/lib/dictionary-fetch';
import { SRPLayout } from '@/components/cars/SRPLayout';
import { IntroOverlay } from '@/components/cars/IntroOverlay';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BMW Stock od ręki | Bawaria Motors',
  description: 'Przeglądaj najnowsze modele BMW dostępne od ręki w salonach Bawaria Motors. Największy wybór, finansowanie i profesjonalne doradztwo.',
};

// Cache for 1 minute to improve navigation and scroll restoration stability
export const revalidate = 60;

import { groupIdenticalCars } from '@/lib/car-grouping';

export default async function Home() {
  const [rawCars, dictionaries] = await Promise.all([
    getAvailableCars(),
    getAllDictionaries()
  ]);

  const cars = groupIdenticalCars(rawCars);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-20 font-sans">
      {/* Intro Overlay */}
      <IntroOverlay featuredCar={cars.sort((a, b) => (b.special_price || b.list_price) - (a.special_price || a.list_price))[0]} />

      {/* Site Header */}
      <SiteHeader />

      {/* Content Area */}
      <div className="pt-24">
        <Suspense fallback={<div className="max-w-[1600px] mx-auto px-6 py-20 text-center text-gray-400">Ładowanie ofert...</div>}>
          <SRPLayout cars={cars} dictionaries={dictionaries} />
        </Suspense>
      </div>
    </main>
  );
}
