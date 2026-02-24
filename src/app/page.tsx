import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getAvailableProductGroups } from '@/lib/stock-fetch';
import { getAllDictionaries } from '@/lib/dictionary-fetch';
import { getActiveBulletins, getCarDiscountedPrice } from '@/lib/bulletin-fetch';
import { SRPLayout } from '@/components/cars/SRPLayout';
import { IntroOverlay } from '@/components/cars/IntroOverlay';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SRPFallback } from '@/components/cars/CarCardSkeleton';
import { Metadata } from 'next';
import { StockCar } from '@/types/stock';

export const metadata: Metadata = {
  title: 'BMW Stock od ręki | Bawaria Motors',
  description: 'Przeglądaj najnowsze modele BMW dostępne od ręki w salonach Bawaria Motors. Największy wybór, finansowanie i profesjonalne doradztwo.',
};

// Cache for 1 minute to improve navigation and scroll restoration stability
export const revalidate = 60;

export default async function Home() {
  const [productGroups, dictionaries, bulletins] = await Promise.all([
    getAvailableProductGroups(),
    getAllDictionaries(),
    getActiveBulletins()
  ]);

  // Transform Product Groups into Representative Cars (for compatibility with SRP Layout)
  const cars: StockCar[] = productGroups.map(group => {
    // Sort units to find best representative
    const sortedUnits = (group.available_units || []).sort((a, b) => {
      // Priority: Ready > Photos > Price
      const score = (c: StockCar) => {
        let s = 0;
        if (c.status_code > 190 && !c.order_status.includes('Sprzedany')) s += 100;
        if (c.images && c.images.length > 0) s += 50;
        return s;
      };
      return score(b) - score(a);
    });

    const representative = sortedUnits[0] || {};

    // Merge Group Data
    return {
      ...representative,
      // Use Group Images if car has none (or prioritize group images logic?)
      // Usually individual car photos are better, but if missing, use group shared photos.
      images: (representative.images && representative.images.length > 0)
        ? representative.images
        : group.images,

      // Use Group overrides
      list_price: group.manual_price || representative.list_price,
      special_price: representative.special_price,

      // Grouping Metadata
      available_count: group.available_count,
      product_group_id: group.id,
      created_at: group.created_at
    } as StockCar;
  });

  // Precompute bulletin-based discounted prices per car
  const bulletinPrices: Record<string, number> = {};
  for (const car of cars) {
    const discountedPrice = getCarDiscountedPrice(car, bulletins);
    if (discountedPrice !== null) {
      bulletinPrices[car.vin] = discountedPrice;
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-20 font-sans">
      {/* Intro Overlay */}
      <IntroOverlay featuredCar={cars.sort((a, b) => (b.special_price || b.list_price) - (a.special_price || a.list_price))[0]} />

      {/* Site Header */}
      <SiteHeader />

      <div className="pt-24">
        <Suspense fallback={<SRPFallback />}>
          <SRPLayout cars={cars} dictionaries={dictionaries} bulletinPrices={bulletinPrices} />
        </Suspense>
      </div>
    </main>
  );
}
