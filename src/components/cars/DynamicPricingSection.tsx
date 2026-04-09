'use client';

import { StockCar } from '@/types/stock';
import { cn } from '@/lib/utils';
import { useVdpStore } from '@/store/vdpStore';
import Image from 'next/image';
import { Phone, Mail } from 'lucide-react';

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

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pl-PL', { style: 'currency', currency: car.currency }).format(price);

    const isSold = (car.order_status || '').includes('Sprzedany');

    // Calculate final displayed price
    const hasManualDiscount = car.special_price && car.special_price < car.list_price;
    const hasBulletinDiscount = !hasManualDiscount && bulletinDiscountedPrice && bulletinDiscountedPrice < car.list_price;
    const basePrice = hasManualDiscount ? car.special_price! : hasBulletinDiscount ? bulletinDiscountedPrice! : car.list_price;
    const finalPrice = basePrice + additionalCost;
    const hasDiscount = hasManualDiscount || hasBulletinDiscount;

    return (
        <div className="space-y-4">
            {/* Price Card - Premium Glassmorphism */}
            <div className={cn(
                "p-5 lg:p-6 rounded-3xl border shadow-xl transition-all duration-700 backdrop-blur-md flex flex-col",
                isDark
                    ? "bg-black/40 border-white/10 shadow-black/50"
                    : "bg-white/60 border-black/[0.03] shadow-black/[0.02]"
            )}>
                {car.list_price > 0 && (
                    <div className="flex flex-col gap-1 mb-5">
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
                        <p className={cn(
                            "text-[8px] font-bold uppercase tracking-widest mt-1 opacity-30 leading-loose",
                            isDark ? "text-white" : "text-black"
                        )}>
                            *Cena brutto zawiera VAT.
                        </p>
                    </div>
                )}

                {/* Divider */}
                <div className={cn("h-px w-full my-1", isDark ? "bg-white/5" : "bg-black/5")} />

                {/* Unified Sales Representative & Contact Section */}
                <div className="flex flex-col pt-4 gap-4">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "relative w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 shadow-sm",
                            isDark ? "border-white/10" : "border-white"
                        )}>
                            <Image 
                                src="/images/avatar.png" 
                                alt="Łukasz Łotoszyński" 
                                fill 
                                className="object-cover"
                            />
                        </div>
                        <div className="flex flex-col justify-center min-w-0">
                            <span className={cn(
                                "text-[8px] uppercase tracking-[0.2em] font-black opacity-40 mb-0.5",
                                isDark ? "text-white" : "text-black"
                            )}>
                                Opiekun Oferty
                            </span>
                            <span className={cn(
                                "text-sm font-bold truncate",
                                isDark ? "text-white" : "text-gray-900"
                            )}>
                                Łukasz Łotoszyński
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <a
                            href={isSold ? undefined : "tel:+48508020612"}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] transition-all",
                                isSold 
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : isDark
                                        ? "bg-white text-black hover:bg-white/90 hover:scale-[1.02] active:scale-95 shadow-lg shadow-white/5"
                                        : "bg-black text-white hover:bg-gray-900 hover:scale-[1.02] active:scale-95 shadow-xl shadow-black/10"
                            )}
                        >
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Zadzwoń</span>
                        </a>
                        
                        <a
                            href={isSold ? undefined : `mailto:lotoszynski_l@bmw-bawariamotors.pl?subject=Pytanie o ofertę: ${offerNumber} (${car.model_name})`}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border transition-all text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em]",
                                isSold
                                    ? "bg-transparent border-gray-100 text-gray-400 cursor-not-allowed"
                                    : isDark
                                        ? "bg-transparent border-white/20 text-white hover:bg-white/5 hover:border-white/30 hover:scale-[1.02] active:scale-95"
                                        : "bg-transparent border-gray-200 text-gray-900 hover:border-black/20 hover:bg-gray-50 hover:scale-[1.02] active:scale-95 hover:shadow-sm"
                            )}
                        >
                            <Mail className="w-4 h-4 shrink-0" />
                            <span className="truncate">Napisz</span>
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
}
