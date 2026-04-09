'use client';

import { useState } from 'react';
import { StockCar } from '@/types/stock';
import { cn } from '@/lib/utils';
import { ContactOverlay } from './ContactOverlay';
import { useVdpStore } from '@/store/vdpStore';

interface DynamicPricingSectionProps {
    car: StockCar;
    seriesCode: string;
    isDark?: boolean;
    fuelType?: string;
    bulletinDiscountedPrice?: number | null;
    offerNumber?: string;
}

export function DynamicPricingSection({ car, seriesCode, isDark = false, fuelType, bulletinDiscountedPrice, offerNumber }: DynamicPricingSectionProps) {
    const { additionalCost } = useVdpStore();
    const [isContactOpen, setIsContactOpen] = useState(false);

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pl-PL', { style: 'currency', currency: car.currency }).format(price);

    const isSold = (car.order_status || '').includes('Sprzedany');

    // Calculate final displayed price
    const hasManualDiscount = car.special_price && car.special_price < car.list_price;
    const hasBulletinDiscount = !hasManualDiscount && bulletinDiscountedPrice && bulletinDiscountedPrice < car.list_price;
    const basePrice = hasManualDiscount ? car.special_price! : hasBulletinDiscount ? bulletinDiscountedPrice! : car.list_price;
    const finalPrice = basePrice + additionalCost;
    const hasDiscount = hasManualDiscount || hasBulletinDiscount;

    const handleContactClick = () => {
        setIsContactOpen(true);
    };

    return (
        <div className="space-y-4">
            {/* Price Card - Premium Glassmorphism */}
            <div className={cn(
                "p-5 lg:p-6 rounded-3xl border shadow-xl transition-all duration-700 backdrop-blur-md",
                isDark
                    ? "bg-black/40 border-white/10 shadow-black/50"
                    : "bg-white/60 border-black/[0.03] shadow-black/[0.02]"
            )}>
                {car.list_price > 0 && (
                    <div className="flex flex-col gap-1 mb-4 lg:mb-5">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className={cn(
                                "text-[9px] uppercase tracking-[0.3em] font-black opacity-30",
                                isDark ? "text-white" : "text-black"
                            )}>
                                Podsumowanie oferty
                            </span>
                            <div className={cn("h-px flex-1", isDark ? "bg-white/10" : "bg-black/5")} />
                        </div>

                        {hasDiscount ? (
                            <div className="flex flex-col">
                                <span className={cn("text-[11px] line-through decoration-red-500/40 opacity-40 mb-0.5 font-medium", isDark ? "text-gray-500" : "text-gray-400")}>
                                    {formatPrice(car.list_price + additionalCost)}
                                </span>
                                <div className="flex items-baseline gap-3">
                                    <span className={cn(
                                        "text-[28px] lg:text-3xl font-black tracking-tight",
                                        isDark ? "text-white" : "text-black"
                                    )}>
                                        {formatPrice(finalPrice)}
                                    </span>
                                    {hasManualDiscount && (
                                        <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-widest">
                                            Okazja
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <span className={cn(
                                "text-[28px] lg:text-3xl font-black tracking-tight",
                                isDark ? "text-white" : "text-black"
                            )}>
                                {formatPrice(finalPrice)}
                            </span>
                        )}

                        {additionalCost > 0 && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <span className={cn("text-[9px] font-black uppercase tracking-[0.15em]", isDark ? "text-blue-400" : "text-blue-600")}>
                                    + {formatPrice(additionalCost)} w pakietach
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <button
                    disabled={isSold}
                    onClick={handleContactClick}
                    className={cn(
                        "w-full py-3.5 text-[10px] font-black uppercase tracking-[0.25em] transition-all rounded-xl",
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
                    "text-center text-[8px] font-bold uppercase tracking-widest mt-3 opacity-30 leading-loose mx-2",
                    isDark ? "text-white" : "text-black"
                )}>
                    *Cena brutto zawiera VAT.
                </p>
            </div>

            <ContactOverlay
                isOpen={isContactOpen}
                onClose={() => setIsContactOpen(false)}
                offerNumber={offerNumber}
            />
        </div>
    );
}
