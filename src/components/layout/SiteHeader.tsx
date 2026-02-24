'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowRight, Warehouse } from 'lucide-react';
import { useGarageStore } from '@/store/garageStore';

export function SiteHeader() {
    const [isScrolled, setIsScrolled] = useState(false);
    const pathname = usePathname();
    const { savedCars, openGarage } = useGarageStore();
    const count = savedCars.length;

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={cn(
                "absolute md:fixed top-0 left-0 right-0 z-40 transition-all duration-500 ease-in-out px-6 border-b",
                isScrolled
                    ? "bg-white/80 backdrop-blur-md border-gray-200 py-3 shadow-sm"
                    : "bg-transparent border-transparent py-4 md:py-6"
            )}
        >
            <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                {/* Logo Area */}
                <Link href="/" className="group flex flex-col">
                    <h1 className={cn(
                        "text-lg md:text-2xl font-bold tracking-tighter transition-colors duration-300",
                        isScrolled ? "text-gray-900" : "text-gray-900"
                    )}>
                        lukilot<span className="text-gray-400 group-hover:text-blue-600 transition-colors">.work</span>
                    </h1>
                    <span className={cn(
                        "text-[10px] font-medium tracking-[0.2em] uppercase transition-colors duration-300",
                        isScrolled ? "text-gray-500" : "text-gray-400"
                    )}>
                        Stock Buffer
                    </span>
                </Link>

                {/* Right Actions */}
                <div className="flex items-center gap-3 md:gap-6">

                    {/* Garage Trigger */}
                    <button
                        onClick={openGarage}
                        className={cn(
                            "relative flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-full transition-all text-xs font-bold uppercase tracking-widest border",
                            count > 0
                                ? "border-gray-900 bg-gray-900 text-white hover:bg-gray-800"
                                : isScrolled
                                    ? "border-gray-200 bg-white text-gray-700 hover:border-gray-900 hover:text-black"
                                    : "border-white/20 bg-white/10 text-gray-800 hover:bg-white/30"
                        )}
                    >
                        <Warehouse className="w-4 h-4 shrink-0" />
                        <span className="hidden md:inline">Garaż</span>
                        {count > 0 && (
                            <span className="bg-white text-gray-900 text-[9px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full font-bold leading-none">
                                {count}
                            </span>
                        )}
                    </button>

                    <Link
                        href="/admin"
                        className={cn(
                            "hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                            isScrolled
                                ? "bg-gray-900 text-white hover:bg-gray-800"
                                : "bg-white border border-gray-200 text-gray-900 hover:border-gray-900"
                        )}
                    >
                        Admin
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        </header>
    );
}
