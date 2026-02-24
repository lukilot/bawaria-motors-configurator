'use client';

import { useCompareStore } from '@/store/compareStore';
import { cn } from '@/lib/utils';
import { Scale, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export function CompareToolbar() {
    const { compareCars, removeCar, clearCompare, openModal } = useCompareStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    if (!mounted || compareCars.length === 0) return null;

    const canCompare = compareCars.length >= 2;

    return (
        <div className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-[520px] pointer-events-none">
            <div
                className="pointer-events-auto backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-white/10 px-4 py-3 flex items-center gap-3"
                style={{ background: 'rgba(17, 17, 17, 0.82)' }}
            >

                {/* Scale icon */}
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Scale className="w-4 h-4" />
                </div>

                {/* Thumbnails */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {compareCars.map(car => (
                        <button
                            key={car.vin}
                            onClick={() => removeCar(car.vin)}
                            title={`Usuń BMW ${car.model_code}`}
                            className="group relative w-10 h-8 rounded overflow-hidden border border-white/20 hover:border-red-400 transition-colors shrink-0"
                        >
                            {(car.images?.[0] || (car as any).group_images?.[0])
                                ? <img src={car.images?.[0]?.url || (car as any).group_images[0].url} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full bg-gray-700" />}
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <X className="w-3 h-3" />
                            </div>
                        </button>
                    ))}
                    {Array.from({ length: 3 - compareCars.length }).map((_, i) => (
                        <div key={i} className="w-10 h-8 border border-white/10 border-dashed rounded shrink-0 flex items-center justify-center">
                            <span className="text-white/20 text-xs">+</span>
                        </div>
                    ))}
                    <span className="text-gray-500 text-xs ml-1 shrink-0">{compareCars.length}/3</span>
                </div>

                {/* Clear */}
                <button
                    onClick={clearCompare}
                    title="Wyczyść"
                    className="text-gray-500 hover:text-white transition-colors p-1 shrink-0"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Compare CTA */}
                <button
                    onClick={openModal}
                    disabled={!canCompare}
                    className={cn(
                        "shrink-0 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                        canCompare
                            ? "bg-white text-black hover:bg-gray-200 cursor-pointer"
                            : "bg-white/10 text-white/30 cursor-not-allowed"
                    )}
                >
                    Porównaj
                </button>
            </div>
        </div>
    );
}
