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
        intro_media_url_mobile: '',
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
                /* Fullscreen Overlay "Blind" */
                <motion.div
                    key="fullscreen"
                    initial={{ y: 0 }}
                    animate={{ y: 0 }}
                    exit={{ y: "-100%", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}
                    className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center overflow-hidden"
                >
                    {/* Background */}
                    <div className="absolute inset-0 z-0">
                        {/* Desktop Media */}
                        {settings.intro_media_url && (
                            <div className={`absolute inset-0 hidden ${settings.intro_media_url_mobile ? 'md:block' : 'block'}`}>
                                {settings.intro_media_url.endsWith('.mp4') || settings.intro_media_url.endsWith('.webm') ? (
                                    <video src={settings.intro_media_url} autoPlay muted loop playsInline className="w-full h-full object-cover opacity-60" />
                                ) : (
                                    <img src={settings.intro_media_url} alt="Intro Desktop" className="w-full h-full object-cover opacity-60" />
                                )}
                            </div>
                        )}

                        {/* Mobile Media */}
                        {settings.intro_media_url_mobile && (
                            <div className="absolute inset-0 block md:hidden">
                                {settings.intro_media_url_mobile.endsWith('.mp4') || settings.intro_media_url_mobile.endsWith('.webm') ? (
                                    <video src={settings.intro_media_url_mobile} autoPlay muted loop playsInline className="w-full h-full object-cover opacity-60" />
                                ) : (
                                    <img src={settings.intro_media_url_mobile} alt="Intro Mobile" className="w-full h-full object-cover opacity-60" />
                                )}
                            </div>
                        )}

                        {/* Fallback Gradient if no media */}
                        {!settings.intro_media_url && !settings.intro_media_url_mobile && (
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
                /* Top Island Notch (Minimized) */
                <motion.div
                    key="notch"
                    initial={{ y: "-100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-100%" }}
                    transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
                    className="fixed top-0 left-1/2 -translate-x-1/2 z-[90] flex justify-center"
                >
                    <div
                        className="bg-black/90 backdrop-blur-md rounded-b-[2rem] px-6 py-3 flex items-center gap-4 shadow-2xl border-b border-x border-white/10 cursor-pointer hover:pt-5 transition-all duration-300 group"
                        onClick={handleMaximize}
                    >
                        {/* Status Dot */}
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />

                        {/* Text */}
                        <div className="flex flex-col items-start justify-center">
                            <span className="text-[10px] uppercase font-bold text-white tracking-widest leading-none">lukilot.work</span>
                        </div>

                        {settings.intro_contact_phone && (
                            <>
                                <div className="w-px h-3 bg-white/20 mx-1" />
                                <a
                                    href={`tel:${settings.intro_contact_phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="hover:text-green-400 transition-colors"
                                >
                                    <Phone className="w-3 h-3 text-white" />
                                </a>
                            </>
                        )}

                        <ChevronDown className="w-3 h-3 text-gray-500 group-hover:text-white transition-colors" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
