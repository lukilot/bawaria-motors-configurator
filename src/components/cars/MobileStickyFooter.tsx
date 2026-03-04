'use client';

import { StockCar } from '@/types/stock';
import { cn } from '@/lib/utils';
import { useVdpStore } from '@/store/vdpStore';
import { useState } from 'react';
import { ContactOverlay } from './ContactOverlay';

interface MobileStickyFooterProps {
    car?: StockCar; // Optional now, can pull from store
    isDark?: boolean;
    bulletinDiscountedPrice?: number | null;
}

export function MobileStickyFooter({ car: propCar, isDark: propIsDark, bulletinDiscountedPrice }: MobileStickyFooterProps) {
    const { currentCar, additionalCost } = useVdpStore();
    const [isContactOpen, setIsContactOpen] = useState(false);

    // Merge prop with store
    const car = propCar || currentCar;
    if (!car) return null;

    const isDark = propIsDark ?? (car.series?.includes('Seria M') || car.model_code?.startsWith('M'));

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pl-PL', { style: 'currency', currency: car.currency, maximumFractionDigits: 0 }).format(price);

    const hasManualDiscount = car.special_price && car.special_price < car.list_price;
    const hasBulletinDiscount = !hasManualDiscount && bulletinDiscountedPrice && bulletinDiscountedPrice < car.list_price;
    const basePrice = hasManualDiscount ? car.special_price! : hasBulletinDiscount ? bulletinDiscountedPrice! : car.list_price;
    const finalPrice = basePrice + additionalCost;

    const isSold = (car.order_status || '').includes('Sprzedany');

    return (
        <div
            className={cn(
                "fixed inset-x-0 bottom-0 z-[99999] lg:hidden border-t px-6 py-4 backdrop-blur-2xl shadow-[0_-20px_40px_rgba(0,0,0,0.1)] transition-all duration-500 pb-[max(1.5rem,env(safe-area-inset-bottom))] transform-gpu",
                isDark
                    ? "bg-[#0a0a0a]/95 border-white/10 text-white shadow-black/80"
                    : "bg-white/95 border-black/5 text-black shadow-black/[0.05]"
            )}
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0
            }}
        >
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex flex-col mb-1.5">
                        <span className={cn(
                            "text-[11px] font-black tracking-tight truncate",
                            isDark ? "text-white" : "text-black"
                        )}>
                            {car.model_name || `BMW ${car.model_code}`}
                        </span>
                        <div className="flex items-center gap-1 opacity-50">
                            {car.status_code > 190 && <span className="w-1 h-1 rounded-full bg-green-500" />}
                            <span className="text-[7px] font-black uppercase tracking-widest truncate">
                                {car.status_code > 190 ? 'Dostępny od ręki' : 'W ofercie'}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-40 mb-0.5">Cena końcowa</span>
                        <span className="text-xl font-black tracking-tighter leading-none">
                            {formatPrice(finalPrice)}
                        </span>
                    </div>
                </div>

                <button
                    disabled={isSold}
                    onClick={() => setIsContactOpen(true)}
                    className={cn(
                        "w-[140px] h-14 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95 shadow-lg shrink-0",
                        isSold
                            ? "bg-gray-100 text-gray-400"
                            : isDark
                                ? "bg-white text-black shadow-white/5"
                                : "bg-black text-white shadow-black/10"
                    )}
                >
                    {isSold ? 'Sprzedany' : 'Sprawdź ofertę'}
                </button>
            </div>

            <ContactOverlay isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
        </div>
    );
}
