'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Search, Menu, ArrowRight } from 'lucide-react';

export function SiteHeader() {
    const [isScrolled, setIsScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isHome = pathname === '/';

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
                <div className="flex items-center gap-6">
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
