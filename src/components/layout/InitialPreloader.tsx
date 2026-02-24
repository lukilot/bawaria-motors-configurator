'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export function InitialPreloader() {
    const [isLoading, setIsLoading] = useState(true);
    const pathname = usePathname();

    useEffect(() => {
        // Prevent scroll while loading
        if (isLoading) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        // Hide after an artistic delay (e.g., 1.2s)
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1200);

        return () => {
            clearTimeout(timer);
            document.body.style.overflow = '';
        };
    }, [isLoading]);

    // Optional: could re-trigger on major pathname changes if desired, 
    // but the request was "Initial Load", so we only run once on component mount.

    if (!isLoading) return null;

    return (
        <div className={cn(
            "fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black text-white transition-opacity duration-700 ease-in-out",
            isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
            {/* Minimal Logo / Typo */}
            <div className="flex flex-col items-center animate-pulse duration-1000">
                <h1 className="text-3xl font-bold tracking-tighter">
                    lukilot<span className="text-gray-500">.work</span>
                </h1>
                <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-gray-400 mt-2">
                    Stock Buffer
                </span>
            </div>

            {/* Subtle progress line */}
            <div className="absolute bottom-1/4 w-32 h-[1px] bg-white/10 overflow-hidden">
                <div className="h-full bg-white w-full animate-[progress_1.2s_ease-in-out]" />
            </div>
        </div>
    );
}
