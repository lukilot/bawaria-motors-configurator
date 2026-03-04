'use client';

import { StockCar } from '@/types/stock';
import { cn } from '@/lib/utils';
import { useVdpStore } from '@/store/vdpStore';
import { useState } from 'react';
import { ContactOverlay } from './ContactOverlay';

interface MobileStickyFooterProps {
    car: StockCar;
    isDark?: boolean;
    bulletinDiscountedPrice?: number | null;
}

export function MobileStickyFooter({ car, isDark = false, bulletinDiscountedPrice }: MobileStickyFooterProps) {
    const { additionalCost } = useVdpStore();
    const [isContactOpen, setIsContactOpen] = useState(false);

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('pl-PL', { style: 'currency', currency: car.currency, maximumFractionDigits: 0 }).format(price);

    const hasManualDiscount = car.special_price && car.special_price < car.list_price;
    const hasBulletinDiscount = !hasManualDiscount && bulletinDiscountedPrice && bulletinDiscountedPrice < car.list_price;
    const basePrice = hasManualDiscount ? car.special_price! : hasBulletinDiscount ? bulletinDiscountedPrice! : car.list_price;
    const finalPrice = basePrice + additionalCost;

    const isSold = (car.order_status || '').includes('Sprzedany');

    return (
        <>
            <div className={cn(
                "fixed bottom-0 left-0 right-0 z-[90] lg:hidden border-t px-6 py-4 pb-8 backdrop-blur-2xl shadow-[0_-20px_40px_rgba(0,0,0,0.1)] transition-colors duration-500",
                isDark
                    ? "bg-black/80 border-white/5 text-white shadow-black/50"
                    : "bg-white/90 border-black/[0.03] text-black shadow-black/[0.02]"
            )}>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Cena końcowa</span>
                        <div className="flex flex-col">
                            <span className="text-xl font-black tracking-tight leading-none">
                                {formatPrice(finalPrice)}
                            </span>
                        </div>
                    </div>

                    <button
                        disabled={isSold}
                        onClick={() => setIsContactOpen(true)}
                        className={cn(
                            "flex-1 max-w-[200px] h-14 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95",
                            isSold
                                ? "bg-gray-100 text-gray-400"
                                : isDark
                                    ? "bg-white text-black shadow-lg shadow-white/5"
                                    : "bg-black text-white shadow-lg shadow-black/10"
                        )}
                    >
                        {isSold ? 'Sprzedany' : 'Sprawdź ofertę'}
                    </button>
                </div>
            </div>

            <ContactOverlay isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
        </>
    );
}
