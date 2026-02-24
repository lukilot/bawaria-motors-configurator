'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Warehouse, ChevronDown } from 'lucide-react';
import { useGarageStore } from '@/store/garageStore';
import { useVdpStore } from '@/store/vdpStore';
import { motion, AnimatePresence } from 'framer-motion';

export function SiteHeader() {
    const [isScrolled, setIsScrolled] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { savedCars, toggleGarage } = useGarageStore();
    const { currentCar, siblings } = useVdpStore();
    const count = savedCars.length;

    const isVdp = pathname.startsWith('/cars/');
    const totalAvailable = siblings.length;

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={cn(
                "fixed top-0 left-0 right-0 z-[1000] transition-all duration-700 ease-in-out px-4 md:px-12",
                isScrolled
                    ? "py-3 bg-white/70 backdrop-blur-2xl border-b border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
                    : "py-6 md:py-8 bg-transparent border-b border-transparent"
            )}
        >
            <div className="max-w-[1800px] mx-auto flex items-center justify-between">
                {/* Left Area: Logo or Back Button */}
                <div className="flex items-center gap-4">
                    <AnimatePresence mode="wait">
                        {isVdp ? (
                            <motion.button
                                key="back-btn"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                onClick={() => router.push('/')}
                                className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/5 hover:bg-black hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest text-gray-900 group"
                            >
                                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                                <span className="hidden sm:inline">Wróć</span>
                            </motion.button>
                        ) : (
                            <motion.div
                                key="logo"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <Link href="/" className="group flex flex-col items-start translate-y-2">
                                    <div className="flex items-baseline">
                                        <h1 className={cn(
                                            "text-xl md:text-2xl font-bold tracking-tighter transition-all duration-500",
                                            isScrolled ? "text-gray-900" : "text-gray-900"
                                        )}>
                                            lukilot<span className="text-gray-400 group-hover:text-blue-600 transition-colors">.work</span>
                                        </h1>
                                    </div>
                                    <motion.span
                                        animate={{ opacity: isScrolled ? 0 : 1, height: isScrolled ? 0 : 'auto' }}
                                        className="text-[9px] font-bold tracking-[0.3em] uppercase text-gray-400 block"
                                    >
                                        Stock Buffer
                                    </motion.span>
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* VDP VIN Selector Integrated */}
                    {isVdp && currentCar && (
                        <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-black/5 rounded-full border border-black/5">
                            {totalAvailable > 1 ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-900">{totalAvailable} szt.</span>
                                    <div className="w-px h-3 bg-black/10 mx-1" />
                                    <select
                                        value={currentCar.vin}
                                        onChange={(e) => router.push(`/cars/${e.target.value}`)}
                                        className="text-[10px] font-mono bg-transparent border-none outline-none cursor-pointer hover:text-blue-600 transition-colors"
                                    >
                                        <option value={currentCar.vin}>{currentCar.vin} (Obecny)</option>
                                        {siblings.filter(s => s.vin !== currentCar.vin).map(s => (
                                            <option key={s.vin} value={s.vin}>
                                                {s.vin} {s.status_code > 190 ? '✅' : '⏳'}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-3 h-3 text-gray-400" />
                                </div>
                            ) : (
                                <span className="text-[10px] text-gray-500 font-mono tracking-wide">{currentCar.vin}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3 md:gap-4">
                    {/* Garage Trigger */}
                    <button
                        onClick={toggleGarage}
                        className={cn(
                            "relative flex items-center gap-2.5 px-4 py-2.5 rounded-full transition-all duration-500 text-[10px] font-bold uppercase tracking-[0.15em] border group/btn",
                            count > 0
                                ? "border-black bg-black text-white hover:bg-gray-800"
                                : isScrolled
                                    ? "border-black/5 bg-black/5 text-gray-900 hover:bg-black hover:text-white"
                                    : "border-black/10 bg-white/10 text-gray-900 hover:bg-black hover:text-white"
                        )}
                    >
                        <Warehouse className="w-3.5 h-3.5 shrink-0 transition-transform duration-500 group-hover/btn:scale-110" />
                        <span className="hidden sm:inline">Garaż</span>
                        {count > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-white text-black text-[9px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full font-bold leading-none shadow-sm"
                            >
                                {count}
                            </motion.span>
                        )}
                    </button>

                    {!isVdp && (
                        <Link
                            href="/admin"
                            className={cn(
                                "hidden md:flex items-center gap-2.5 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-500 border group/admin",
                                isScrolled
                                    ? "bg-white/50 border-black/5 text-gray-900 hover:bg-black hover:text-white"
                                    : "bg-white border-black/5 text-gray-900 hover:bg-black hover:text-white"
                            )}
                        >
                            Admin
                            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-500 group-hover/admin:translate-x-1" />
                        </Link>
                    )}
                </div>
            </div>
        </motion.header>
    );
}
