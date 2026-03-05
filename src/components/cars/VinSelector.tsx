'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronDown, CheckCircle2, Clock } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VinSelectorProps {
    currentVin: string;
    siblings: { vin: string; status_code: number }[];
    isDark?: boolean;
}

export function VinSelector({ currentVin, siblings, isDark }: VinSelectorProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const totalAvailable = siblings.length + 1;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    if (totalAvailable <= 1) {
        return (
            <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Numer VIN</span>
                <span className={cn(
                    "text-[12px] font-mono font-bold tracking-widest",
                    isDark ? "text-white" : "text-black"
                )}>
                    {currentVin}
                </span>
            </div>
        );
    }

    const availableSiblings = siblings.filter(s => s.vin !== currentVin);

    const handleSelect = (vin: string) => {
        setIsOpen(false);
        router.push(`/cars/${vin}`);
    };

    return (
        <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
                Wybierz egzemplarz ({totalAvailable} szt.)
            </span>

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "group relative flex items-center justify-between w-full px-4 py-3 rounded-2xl border transition-all duration-300",
                    isDark
                        ? "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                        : "bg-black/[0.02] border-black/5 hover:border-black/10 hover:bg-black/5",
                    isOpen && (isDark ? "!border-white/30 !bg-white/10" : "!border-black/20 !bg-black/5")
                )}
            >
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-[12px] font-mono font-bold",
                        isDark ? "text-white" : "text-black"
                    )}>
                        {currentVin}
                    </span>
                    <span className={cn("text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm bg-black/10", isDark ? "text-white/60 bg-white/10" : "text-black/50")}>
                        Obecny
                    </span>
                </div>
                <ChevronDown className={cn(
                    "w-4 h-4 shrink-0 transition-transform duration-300",
                    isDark ? "text-white/40 group-hover:text-white" : "text-black/40 group-hover:text-black",
                    isOpen && "rotate-180"
                )} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={cn(
                            "absolute top-[calc(100%+8px)] left-0 w-full z-50 rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col max-h-[280px] overflow-y-auto custom-scrollbar",
                            isDark
                                ? "bg-[#111111]/90 border-white/10"
                                : "bg-white/95 border-black/5"
                        )}
                    >
                        <div className="flex flex-col p-1">
                            {/* Obecny */}
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex items-center justify-between px-3 py-3 rounded-xl transition-colors cursor-default",
                                    isDark ? "bg-white/5" : "bg-black/5"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={cn("text-[12px] font-mono font-bold", isDark ? "text-white" : "text-black")}>
                                        {currentVin}
                                    </span>
                                </div>
                                <span className={cn("text-[9px] uppercase font-bold", isDark ? "text-white/40" : "text-black/40")}>
                                    Przeglądasz
                                </span>
                            </button>

                            {/* Pozostale */}
                            {availableSiblings.map(s => {
                                const isReady = s.status_code > 190;
                                return (
                                    <button
                                        key={s.vin}
                                        type="button"
                                        onClick={() => handleSelect(s.vin)}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-3 rounded-xl transition-colors text-left",
                                            isDark ? "hover:bg-white/10" : "hover:bg-black/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={cn("text-[12px] font-mono font-medium", isDark ? "text-gray-300" : "text-gray-700")}>
                                                {s.vin}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5" title={isReady ? "Dostępny od ręki" : "W drodze / w produkcji"}>
                                            {isReady ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <Clock className={cn("w-4 h-4", isDark ? "text-yellow-400" : "text-yellow-500")} />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
