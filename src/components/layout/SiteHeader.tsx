'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowRight, Warehouse } from 'lucide-react';
import { useGarageStore } from '@/store/garageStore';
import { motion, AnimatePresence } from 'framer-motion';

export function SiteHeader() {
    const [isScrolled, setIsScrolled] = useState(false);
    const pathname = usePathname();
    const { savedCars, openGarage } = useGarageStore();
    const count = savedCars.length;

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
                "fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ease-in-out px-6 md:px-12",
                isScrolled
                    ? "py-3 bg-white/40 backdrop-blur-2xl border-b border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
                    : "py-6 md:py-8 bg-transparent border-b border-transparent"
            )}
        >
            <div className="max-w-[1800px] mx-auto flex items-center justify-between">
                {/* Logo Area */}
                <Link href="/" className="group flex flex-col items-start">
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

                {/* Right Actions */}
                <div className="flex items-center gap-3 md:gap-4">
                    {/* Garage Trigger */}
                    <button
                        onClick={openGarage}
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
                </div>
            </div>
        </motion.header>
    );
}
