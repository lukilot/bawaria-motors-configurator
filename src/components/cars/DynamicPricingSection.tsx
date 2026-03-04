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
        <div className="space-y-10">
            {/* Service Configurator */}
            <div className={cn(
                "rounded-2xl border transition-all duration-500",
                isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"
            )}>
                <ServicePackageConfigurator
                    currentCodes={car.option_codes}
                    seriesCode={seriesCode}
                    fuelType={fuelType || car.fuel_type}
                    onPriceUpdate={setAdditionalCost}
                    onSelectionChange={setSelectedServiceCodes}
                    isDark={isDark}
                />
            </div>

            {/* Price Card - Premium Glassmorphism */}
            <div className={cn(
                "p-8 rounded-3xl border shadow-xl transition-all duration-700 backdrop-blur-md",
                isDark
                    ? "bg-black/40 border-white/10 shadow-black/50"
                    : "bg-white/60 border-black/[0.03] shadow-black/[0.02]"
            )}>
                {car.list_price > 0 && (
                    <div className="flex flex-col gap-2 mb-8">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                                "text-[10px] uppercase tracking-[0.3em] font-black opacity-40",
                                isDark ? "text-white" : "text-black"
                            )}>
                                Podsumowanie oferty
                            </span>
                            <div className={cn("h-px flex-1", isDark ? "bg-white/10" : "bg-black/5")} />
                        </div>

                        {hasDiscount ? (
                            <div className="flex flex-col">
                                <span className={cn("text-[13px] line-through decoration-red-500/40 mb-1 font-medium", isDark ? "text-gray-500" : "text-gray-400")}>
                                    {formatPrice(car.list_price + additionalCost)}
                                </span>
                                <div className="flex items-baseline gap-3">
                                    <span className={cn(
                                        "text-4xl font-black tracking-tight",
                                        isDark ? "text-white" : "text-black"
                                    )}>
                                        {formatPrice(finalPrice)}
                                    </span>
                                    {hasManualDiscount && (
                                        <span className="bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-sm uppercase tracking-widest">
                                            Okazja
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <span className={cn(
                                "text-4xl font-black tracking-tight",
                                isDark ? "text-white" : "text-black"
                            )}>
                                {formatPrice(finalPrice)}
                            </span>
                        )}

                        {additionalCost > 0 && (
                            <span className={cn("text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1", isDark ? "text-white" : "text-black")}>
                                + wybrane pakiety: {formatPrice(additionalCost)}
                            </span>
                        )}
                    </div>
                )}

                <button
                    disabled={isSold}
                    onClick={handleContactClick}
                    className={cn(
                        "w-full py-5 text-[11px] font-black uppercase tracking-[0.25em] transition-all rounded-xl",
                        isSold
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : isDark
                                ? "bg-white text-black hover:bg-white/90 hover:scale-[1.02] active:scale-95 shadow-lg shadow-white/5"
                                : "bg-black text-white hover:bg-gray-900 hover:scale-[1.02] active:scale-95 shadow-xl shadow-black/10"
                    )}
                >
                    {isSold ? 'Pojazd Sprzedany' : 'Jestem zainteresowany'}
                </button>

                <p className={cn(
                    "text-center text-[9px] font-bold uppercase tracking-widest mt-6 opacity-30 leading-loose mx-4",
                    isDark ? "text-white" : "text-black"
                )}>
                    *Cena brutto zawiera podatek VAT. Samochód dostępny od ręki.
                </p>
            </div>

            <ContactOverlay
                isOpen={isContactOpen}
                onClose={() => setIsContactOpen(false)}
            />
        </div>
    );
}
