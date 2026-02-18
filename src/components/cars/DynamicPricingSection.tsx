'use client';

import { useState } from 'react';
import { StockCar } from '@/types/stock';
import { cn } from '@/lib/utils';
import { ServicePackageConfigurator } from './ServicePackageConfigurator';
import { ContactOverlay } from './ContactOverlay';

interface DynamicPricingSectionProps {
    car: StockCar;
    seriesCode: string;
    isDark?: boolean;
    fuelType?: string;
    bulletinDiscountedPrice?: number | null;
}

export function DynamicPricingSection({ car, seriesCode, isDark = false, fuelType, bulletinDiscountedPrice }: DynamicPricingSectionProps) {
    // State for additional costs from service packages
    const [additionalCost, setAdditionalCost] = useState(0);
    const [selectedServiceCodes, setSelectedServiceCodes] = useState<string[]>([]);
    const [isContactOpen, setIsContactOpen] = useState(false);

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pl-PL', { style: 'currency', currency: car.currency }).format(price);

    const isSold = (car.order_status || '').includes('Sprzedany');

    // Calculate final displayed price
    // Priority: manual special_price > bulletin discount > list_price
    const hasManualDiscount = car.special_price && car.special_price < car.list_price;
    const hasBulletinDiscount = !hasManualDiscount && bulletinDiscountedPrice && bulletinDiscountedPrice < car.list_price;
    const basePrice = hasManualDiscount ? car.special_price! : hasBulletinDiscount ? bulletinDiscountedPrice! : car.list_price;
    const finalPrice = basePrice + additionalCost;
    const hasDiscount = hasManualDiscount || hasBulletinDiscount;

    const handleContactClick = () => {
        setIsContactOpen(true);
    };

    return (
        <div className="space-y-8">
            {/* Service Configurator */}
            <ServicePackageConfigurator
                currentCodes={car.option_codes}
                seriesCode={seriesCode}
                fuelType={fuelType || car.fuel_type}
                onPriceUpdate={setAdditionalCost}
                onSelectionChange={setSelectedServiceCodes}
                isDark={isDark}
            />

            {/* Price Card */}
            <div className={cn(
                "p-6 rounded-sm border transition-all duration-300 ease-in-out",
                isDark ? "bg-[#1a1a1a] border-gray-800" : "bg-gray-50 border-gray-100"
            )}>
                {car.list_price > 0 && (
                    <div className="flex flex-col gap-1 mb-6">
                        <span className={cn("text-xs uppercase tracking-widest font-semibold", isDark ? "text-gray-400" : "text-gray-500")}>Cena całkowita</span>

                        {/* Show old price crossed out if there is a discount AND no added cost (or distinct display?)
                            Actually, if we add costs, the "list price" concept gets fuzzy. 
                            Let's keep it simple: 
                            If discount exists: Show List Price (crossed) -> Final Special Price (Base Special + Services)
                            If no discount: Show Final Price (Base List + Services)
                        */}

                        {hasDiscount ? (
                            <div className="flex flex-col">
                                <span className={cn("text-sm line-through decoration-gray-300", isDark ? "text-gray-500" : "text-gray-400")}>
                                    {formatPrice(car.list_price + additionalCost)}
                                    {/* Note: usually list price also increases if we add services, 
                                        so logically we add cost to both base and special */}
                                </span>
                                <span className={cn(
                                    "text-3xl font-bold tracking-tight transition-colors",
                                    isDark ? "text-white" : (additionalCost > 0 ? "text-black" : "text-gray-900")
                                )}>
                                    {formatPrice(finalPrice)}
                                </span>
                            </div>
                        ) : (
                            <span className={cn(
                                "text-3xl font-bold tracking-tight transition-colors",
                                isDark ? "text-white" : (additionalCost > 0 ? "text-black" : "text-gray-900")
                            )}>
                                {formatPrice(finalPrice)}
                            </span>
                        )}


                    </div>
                )}

                <button
                    disabled={isSold}
                    onClick={handleContactClick}
                    className={cn(
                        "w-full py-4 text-sm font-bold uppercase tracking-widest transition-all shadow-lg",
                        isSold
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                            : "bg-black text-white hover:bg-gray-800 hover:shadow-xl translate-y-0 hover:-translate-y-0.5"
                    )}
                >
                    {isSold ? 'Pojazd Sprzedany' : 'Jestem zainteresowany'}
                </button>
                <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
                    *Cena zawiera VAT. Zdjęcia mają charakter poglądowy.
                </p>
            </div>

            <ContactOverlay
                isOpen={isContactOpen}
                onClose={() => setIsContactOpen(false)}
            />
        </div>
    );
}
