'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NeueKlasseGrille } from '@/components/animations/NeueKlasseGrille';
import { AnimatePresence, motion } from 'framer-motion';

export function NavigationPreloader() {
    const pathname = usePathname();
    const [isNavigating, setIsNavigating] = useState(false);
    const [prevPath, setPrevPath] = useState(pathname);

    useEffect(() => {
        if (pathname !== prevPath) {
            // Path arrived, so stop the loading overlay after a short delay
            // to cover image load time and give a smooth transition
            const timer = setTimeout(() => {
                setIsNavigating(false);
                setPrevPath(pathname);
            }, 800); // 800ms ensures the VDP images have some time to load + animation looks complete
            return () => clearTimeout(timer);
        }
    }, [pathname, prevPath]);

    // Expose a global way to start navigation
    useEffect(() => {
        const handleStart = () => setIsNavigating(true);
        window.addEventListener('start-navigation', handleStart);
        return () => window.removeEventListener('start-navigation', handleStart);
    }, []);

    return (
        <AnimatePresence>
            {isNavigating && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#050505]"
                >
                    <NeueKlasseGrille className="w-full max-w-lg px-8" isDark={true} />
                    
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center mt-12 gap-3"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '0ms' }} />
                            <div className="w-1 h-1 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '150ms' }} />
                            <div className="w-1 h-1 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '300ms' }} />
                        </div>
                        <div className="text-[10px] uppercase font-bold tracking-[0.4em] text-white/50">
                            Przygotowuję auto...
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
