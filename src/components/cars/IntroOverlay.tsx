'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ArrowRight, Phone, ChevronDown } from 'lucide-react';
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

    const containerVariants: Variants = {
        maximized: {
            width: "100%",
            height: "100%",
            borderRadius: "0px",
            y: 0,
            x: 0,
            top: 0,
            left: 0,
            transition: {
                type: "spring",
                stiffness: 70,
                damping: 15,
                mass: 0.8
            }
        },
        minimized: {
            width: "auto",
            height: "auto",
            borderRadius: "0px 0px 32px 32px",
            y: 0,
            x: "-50%",
            top: 0,
            left: "50%",
            transition: {
                type: "spring",
                stiffness: 70,
                damping: 15,
                mass: 0.8
            }
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                layout
                initial={false}
                animate={isMinimized || hasSeenIntro ? "minimized" : "maximized"}
                variants={containerVariants}
                className={`fixed z-[100] bg-black text-white overflow-hidden shadow-2xl ${isMinimized ? 'cursor-pointer' : ''}`}
                onClick={isMinimized ? handleMaximize : undefined}
                style={{ originY: 0 }}
            >
                {/* Background (Only visible in maximized state) */}
                <motion.div
                    animate={{ opacity: isMinimized ? 0 : 1 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 z-0 pointer-events-none"
                >
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

                    {/* Fallback Gradient */}
                    {!settings.intro_media_url && !settings.intro_media_url_mobile && (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-blue-950/20" />
                    )}

                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
                </motion.div>

                {/* Content Switcher */}
                <div className="relative z-10 w-full h-full">
                    {!isMinimized ? (
                        <motion.div
                            key="full-content"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="w-full h-full flex flex-col items-center justify-center gap-12 max-w-4xl mx-auto px-6 pt-20"
                        >
                            <motion.div>
                                <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-4 text-center">
                                    lukilot.work
                                </h1>
                                <p className="text-gray-400 text-lg md:text-xl font-light tracking-wide text-center">
                                    BAWARIA MOTORS STOCK BUFFER
                                </p>
                            </motion.div>

                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                {(settings.intro_cta_link || featuredCar) && (
                                    <Link
                                        href={settings.intro_cta_link || `/cars/${featuredCar?.vin}`}
                                        onClick={(e) => { e.stopPropagation(); handleMinimize(); }}
                                        className="px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors flex items-center gap-3"
                                    >
                                        <span>Featured Offer</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                )}

                                <button
                                    onClick={(e) => { e.stopPropagation(); handleMinimize(); }}
                                    className="px-12 py-4 bg-transparent border border-white/20 text-white font-medium uppercase tracking-widest text-xs hover:bg-white/10 transition-colors backdrop-blur-sm"
                                >
                                    Enter Site
                                </button>
                            </div>

                            {settings.intro_contact_phone && (
                                <div className="absolute bottom-12 flex items-center gap-3 text-gray-400">
                                    <Phone className="w-4 h-4" />
                                    <span className="text-xs tracking-widest">{settings.intro_contact_phone}</span>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="notch-content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="flex items-center gap-4 px-6 py-3 min-w-[300px] justify-between text-nowrap"
                        >
                            <div className="flex items-center gap-4">
                                {/* Status Dot */}
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />

                                {/* Text */}
                                <div className="flex flex-col items-start justify-center">
                                    <span className="text-[10px] uppercase font-bold text-white tracking-widest leading-none">lukilot.work</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {settings.intro_contact_phone && (
                                    <>
                                        <a
                                            href={`tel:${settings.intro_contact_phone}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="hover:text-green-400 transition-colors p-1"
                                        >
                                            <Phone className="w-3 h-3 text-white" />
                                        </a>
                                        <div className="w-px h-3 bg-white/20" />
                                    </>
                                )}

                                <ChevronDown className="w-3 h-3 text-gray-500 group-hover:text-white transition-colors" />
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
