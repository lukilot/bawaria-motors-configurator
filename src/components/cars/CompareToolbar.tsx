'use client';

import { useCompareStore } from '@/store/compareStore';
import { cn } from '@/lib/utils';
import { Scale, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function CompareToolbar() {
    const { compareCars, removeCar, clearCompare, openModal } = useCompareStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const canCompare = compareCars.length >= 2;

    return (
        <AnimatePresence>
            {mounted && compareCars.length > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 100, opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 0.8 }}
                    className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-[560px] pointer-events-none"
                >
                    <div
                        className="pointer-events-auto backdrop-blur-2xl text-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/20 p-3 sm:p-4 flex flex-row items-center gap-3 overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, rgba(20,20,20,0.85) 0%, rgba(30,30,30,0.95) 100%)' }}
                    >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />

                        <div className="flex items-center gap-3 sm:gap-4 flex-1 mix-blend-plus-lighter relative z-10 min-w-0">
                            {/* Scale icon — hidden on mobile to save space */}
                            <div className="hidden sm:flex w-10 h-10 rounded-full bg-white/10 items-center justify-center shrink-0 border border-white/10 shadow-inner">
                                <Scale className="w-5 h-5 text-white/90" />
                            </div>

                            {/* Thumbnails */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <AnimatePresence mode="popLayout">
                                    {compareCars.map(car => (
                                        <motion.div
                                            key={car.vin}
                                            layout
                                            initial={{ opacity: 0, scale: 0.5, x: -20 }}
                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.5, x: 20 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                            className="group relative w-12 h-10 rounded-lg overflow-hidden border border-white/20 hover:border-red-500/80 hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all shrink-0 cursor-pointer"
                                            onClick={() => removeCar(car.vin)}
                                            title={`Usuń BMW ${car.model_code}`}
                                        >
                                            {(car.images?.[0] || (car as any).group_images?.[0])
                                                ? <img src={car.images?.[0]?.url || (car as any).group_images[0].url} alt="" className="w-full h-full object-cover" />
                                                : <div className="w-full h-full bg-gray-700" />}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                <X className="w-4 h-4 text-white drop-shadow-md" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {/* Empty slots — hidden on mobile so they don't take up space */}
                                {Array.from({ length: 3 - compareCars.length }).map((_, i) => (
                                    <motion.div
                                        layout
                                        key={`empty-${i}`}
                                        className="hidden sm:flex w-12 h-10 border border-white/10 border-dashed rounded-lg shrink-0 items-center justify-center bg-white/5"
                                    >
                                        <span className="text-white/20 text-sm font-light">+</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 relative z-10 shrink-0">
                            {/* Clear */}
                            <button
                                onClick={clearCompare}
                                title="Wyczyść wszystko"
                                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Compare CTA */}
                            <button
                                onClick={openModal}
                                disabled={!canCompare}
                                className={cn(
                                    "shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap shadow-lg",
                                    canCompare
                                        ? "bg-white text-black hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-white/20"
                                        : "bg-white/10 text-white/30 cursor-not-allowed shadow-none"
                                )}
                            >
                                <span className="sm:hidden">Porównaj ({compareCars.length})</span>
                                <span className="hidden sm:inline">Porównaj ({compareCars.length}/3)</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
