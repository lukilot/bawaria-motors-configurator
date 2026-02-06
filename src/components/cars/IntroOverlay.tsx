'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import Link from 'next/link';
import { StockCar } from '@/types/stock';

interface IntroOverlayProps {
    featuredCar?: StockCar;
}

export function IntroOverlay({ featuredCar }: IntroOverlayProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [hasSeenIntro, setHasSeenIntro] = useState(false);

    useEffect(() => {
        // Check session storage
        const seen = sessionStorage.getItem('lukilot_intro_seen');
        if (seen) {
            setIsVisible(false);
            setHasSeenIntro(true);
        } else {
            // Lock body scroll
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const handleEnterSite = () => {
        setIsVisible(false);
        sessionStorage.setItem('lukilot_intro_seen', 'true');
        document.body.style.overflow = '';
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
                    className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center overflow-hidden"
                >
                    {/* Background Visuals */}
                    <div className="absolute inset-0 z-0">
                        {/* Gradient Mesh or Video Placeholder */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
                        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />

                        {/* Dynamic decorative elements */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 blur-[100px] rounded-full"
                        />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 text-center flex flex-col items-center gap-12 max-w-4xl px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 1 }}
                        >
                            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-4">
                                lukilot.work
                            </h1>
                            <p className="text-gray-400 text-lg md:text-xl font-light tracking-wide">
                                BAWARIA MOTORS STOCK BUFFER
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.8 }}
                            className="flex flex-col md:flex-row gap-6 items-center"
                        >
                            {featuredCar && (
                                <Link
                                    href={`/cars/${featuredCar.vin}`}
                                    onClick={handleEnterSite}
                                    className="group relative px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors flex items-center gap-3 overflow-hidden"
                                >
                                    <span className="relative z-10">Featured Offer</span>
                                    <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            )}

                            <button
                                onClick={handleEnterSite}
                                className="group px-8 py-4 bg-transparent border border-white/20 text-white font-medium uppercase tracking-widest text-sm hover:bg-white/10 transition-colors backdrop-blur-sm"
                            >
                                Enter Site
                            </button>
                        </motion.div>
                    </div>

                    {/* Footer text */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5, duration: 1 }}
                        className="absolute bottom-12 text-xs text-gray-600 uppercase tracking-widest"
                    >
                        Premium Automotive Experience
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
