import { getAvailableProductGroups } from '@/lib/stock-fetch';
import { getAllDictionaries } from '@/lib/dictionary-fetch';
import { getActiveBulletins, getCarDiscountedPrice } from '@/lib/bulletin-fetch';
import { StockCar } from '@/types/stock';
import { Hero } from '@/components/home/Hero';
import { FeaturedOffers } from '@/components/home/FeaturedOffers';
import { AboutMe } from '@/components/home/AboutMe';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BMW Bawaria Motors | Twoje Doradztwo Premium',
  description: 'Odkryj świat BMW w wyjątkowym wydaniu. Indywidualne doradztwo, unikatowe konfiguracje i luksusowa obsługa w Bawaria Motors.',
};

// Cache for 1 minute
export const revalidate = 60;

export default async function Home() {
  const [productGroups, dictionaries, bulletins] = await Promise.all([
    getAvailableProductGroups(),
    getAllDictionaries(),
    getActiveBulletins()
  ]);

  // Transform Product Groups into Representative Cars
  const cars: StockCar[] = productGroups.map(group => {
    const sortedUnits = (group.available_units || []).sort((a, b) => {
      const score = (c: StockCar) => {
        let s = 0;
        if (c.status_code > 190 && !c.order_status.includes('Sprzedany')) s += 100;
        if (c.images && c.images.length > 0) s += 50;
        return s;
      };
      return score(b) - score(a);
    });

    const representative = sortedUnits[0] || {};
    return {
      ...representative,
      images: (representative.images && representative.images.length > 0)
        ? representative.images
        : group.images,
      list_price: group.manual_price || representative.list_price,
      special_price: representative.special_price,
      available_count: group.available_count,
      product_group_id: group.id,
      created_at: group.created_at
    } as StockCar;
  });

  // Pick top 3 "Featured" cars (prefer Individual paint code 490 or M Series)
  const featuredCars = cars
    .filter(c => !(c.order_status || '').includes('Sprzedany'))
    .sort((a, b) => {
      const score = (c: StockCar) => {
        let s = 0;
        if (c.color_code === '490') s += 100;
        if ((c.series || '').includes('Seria M')) s += 50;
        if (c.special_price) s += 20;
        return s;
      };
      return score(b) - score(a);
    })
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <FeaturedOffers cars={featuredCars} dictionaries={dictionaries} />
      <AboutMe />
    </main>
  );
}
