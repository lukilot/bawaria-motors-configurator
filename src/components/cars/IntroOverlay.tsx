'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Phone, Play, X, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { StockCar } from '@/types/stock';
import { supabase } from '@/lib/supabase';

interface IntroOverlayProps {
    featuredCar?: StockCar;
}

export function IntroOverlay({ featuredCar }: IntroOverlayProps) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [hasSeenIntro, setHasSeenIntro] = useState(false);
    const [settings, setSettings] = useState({
        intro_media_url: '',
        intro_cta_link: '',
        intro_contact_phone: ''
    });

    useEffect(() => {
        // Load settings
        const loadSettings = async () => {
            const { data } = await supabase.from('site_settings').select('key, value');
            const newSettings: any = {};
            data?.forEach(item => newSettings[item.key] = item.value);
            setSettings(prev => ({ ...prev, ...newSettings }));
        };
        loadSettings();

        // Check session
        const seen = sessionStorage.getItem('lukilot_intro_seen');
        if (seen) {
            setIsMinimized(true);
            setHasSeenIntro(true);
        } else {
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const handleMinimize = () => {
        setIsMinimized(true);
        sessionStorage.setItem('lukilot_intro_seen', 'true');
        document.body.style.overflow = '';
    };

    const handleMaximize = () => {
        setIsMinimized(false);
        document.body.style.overflow = 'hidden';
    };

    return (
        <AnimatePresence mode="wait">
            {!isMinimized ? (
                /* Fullscreen Overlay */
                <motion.div
                    layoutId="intro-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.5 } }}
                    className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center overflow-hidden"
                >
                    {/* Background */}
                    <div className="absolute inset-0 z-0">
                        {settings.intro_media_url ? (
                            settings.intro_media_url.endsWith('.mp4') || settings.intro_media_url.endsWith('.webm') ? (
                                <video src={settings.intro_media_url} autoPlay muted loop className="w-full h-full object-cover opacity-60" />
                            ) : (
                                <img src={settings.intro_media_url} alt="Intro" className="w-full h-full object-cover opacity-60" />
                            )
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-blue-950/20" />
                        )}
                        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 text-center flex flex-col items-center gap-12 max-w-4xl px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-4">
                                lukilot.work
                            </h1>
                            <p className="text-gray-400 text-lg md:text-xl font-light tracking-wide">
                                BAWARIA MOTORS STOCK BUFFER
                            </p>
                        </motion.div>

                        <div className="flex flex-col md:flex-row gap-6 items-center">
                            {/* Featured / Configured CTA */}
                            {(settings.intro_cta_link || featuredCar) && (
                                <Link
                                    href={settings.intro_cta_link || `/cars/${featuredCar?.vin}`}
                                    onClick={handleMinimize}
                                    className="px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors flex items-center gap-3"
                                >
                                    <span>Featured Offer</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            )}

                            {/* Enter Site Button (Triggers Minimize) */}
                            <button
                                onClick={handleMinimize}
                                className="px-12 py-4 bg-transparent border border-white/20 text-white font-medium uppercase tracking-widest text-xs hover:bg-white/10 transition-colors backdrop-blur-sm"
                            >
                                Enter Site
                            </button>
                        </div>
                    </div>

                    {/* Footer Contact */}
                    {settings.intro_contact_phone && (
                        <div className="absolute bottom-12 flex items-center gap-3 text-gray-400">
                            <Phone className="w-4 h-4" />
                            <span className="text-xs tracking-widest">{settings.intro_contact_phone}</span>
                        </div>
                    )}
                </motion.div>
            ) : (
                /* Tech Notch (Minimized) */
                <motion.div
                    layoutId="intro-overlay"
                    className="fixed top-0 left-1/2 -translate-x-1/2 z-[90] flex justify-center pt-2"
                >
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "auto", opacity: 1 }}
                        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                        className="bg-black/90 backdrop-blur-md rounded-full px-1 py-1 flex items-center gap-2 shadow-2xl border border-white/10 cursor-pointer hover:scale-105 transition-transform group"
                        onClick={handleMaximize}
                    >
                        {/* Status Dot */}
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        </div>

                        {/* Text (Only visible on hover or large screens) */}
                        <div className="flex items-center gap-4 px-2 pr-4 overflow-hidden">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-white tracking-widest leading-none mb-0.5">lukilot.work</span>
                                <span className="text-[8px] text-gray-400 leading-none">Tap to expand</span>
                            </div>

                            {settings.intro_contact_phone && (
                                <>
                                    <div className="w-px h-6 bg-white/10" />
                                    <a
                                        href={`tel:${settings.intro_contact_phone}`}
                                        onClick={(e) => e.stopPropagation()} // Prevent expand when calling
                                        className="p-1.5 bg-white/10 rounded-full hover:bg-green-600 transition-colors"
                                    >
                                        <Phone className="w-3 h-3 text-white" />
                                    </a>
                                </>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
