import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getAvailableCars } from '@/lib/stock-fetch';
import { getAllDictionaries } from '@/lib/dictionary-fetch';
import { SRPLayout } from '@/components/cars/SRPLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BMW Stock od ręki | Bawaria Motors',
  description: 'Przeglądaj najnowsze modele BMW dostępne od ręki w salonach Bawaria Motors. Największy wybór, finansowanie i profesjonalne doradztwo.',
};

// Cache for 1 minute to improve navigation and scroll restoration stability
export const revalidate = 60;

export default async function Home() {
  const [cars, dictionaries] = await Promise.all([
    getAvailableCars(),
    getAllDictionaries()
  ]);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-20 font-sans">
      {/* Hero / Header */}
      <header className="bg-white border-b border-gray-100 py-12 px-6 relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-extralight tracking-tight mb-2 text-gray-900">
              lukilot.work <span className="font-semibold text-blue-600">/ Bawaria Stock Buffer</span>
            </h1>
            <p className="text-gray-500 font-light max-w-lg">
              Zapoznaj się z naszą ofertą dostępną od ręki.
            </p>
          </div>

          <Link
            href="/admin"
            className="group flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-900 hover:border-black transition-all font-medium text-xs uppercase tracking-widest shadow-sm"
          >
            Internal Admin
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Subtle BMW Gradient */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-50/50 to-transparent -z-0 pointer-events-none" />
      </header>

      {/* Content Area */}
      <Suspense fallback={<div className="max-w-[1600px] mx-auto px-6 py-20 text-center text-gray-400">Ładowanie ofert...</div>}>
        <SRPLayout cars={cars} dictionaries={dictionaries} />
      </Suspense>
    </main>
  );
}
