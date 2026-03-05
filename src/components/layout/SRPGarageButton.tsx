'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { Warehouse } from 'lucide-react';
import { useGarageStore } from '@/store/garageStore';
import { cn } from '@/lib/utils';

/**
 * Floating garage button shown only on /cars (SRP) route.
 * Uses createPortal to render directly into document.body,
 * bypassing any CSS stacking context issues in the layout.
 */
export function SRPGarageButton() {
    const { savedCars, toggleGarage } = useGarageStore();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Only show on the main SRP page
    const isOnSRP = pathname === '/cars';

    if (!mounted || !isOnSRP) return null;

    const count = savedCars?.length || 0;

    const button = (
        <button
            onClick={toggleGarage}
            aria-label="Otwórz garaż"
            className={cn(
                "flex items-center justify-center w-14 h-14 rounded-full border transition-all duration-200 cursor-pointer",
                "shadow-[0_8px_32px_rgba(0,0,0,0.2)]",
                "hover:scale-105 active:scale-95",
                count > 0
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-black/10 hover:bg-gray-50"
            )}
            style={{
                position: 'fixed',
                bottom: '2rem',
                right: '1.5rem',
                zIndex: 99999,
            }}
        >
            <div className="relative">
                <Warehouse className="w-6 h-6" />
                {count > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-blue-600 text-[10px] font-black text-white flex items-center justify-center border-2 border-white">
                        {count}
                    </span>
                )}
            </div>
        </button>
    );

    // Portal renders directly into body, escaping all CSS stacking contexts
    return createPortal(button, document.body);
}
