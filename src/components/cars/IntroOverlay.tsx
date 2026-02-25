'use client';

import { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ArrowDown, Phone, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function IntroOverlay() {
    const pathname = usePathname();
    const isAdmin = pathname.startsWith('/admin');
    const isHome = pathname === '/';

    if (isAdmin) return null;
    const [isMinimized, setIsMinimized] = useState(false);
    const [showNumber, setShowNumber] = useState(false); // For desktop contact pill toggle
    const [settings, setSettings] = useState({
        intro_media_url: '',
        intro_media_url_mobile: '',
        intro_contact_phone: '+48 508 020 612' // Default fallback with spaces logic
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
        if (!isHome || seen) {
            setIsMinimized(true);
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
        // window.scrollTo(0, 0); // Removed: Do not reset scroll on maximize
    };

    // Desktop: Toggle number visibility
    const handleContactClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.matchMedia('(min-width: 768px)').matches) {
            setShowNumber(true);
        }
    };

    const containerVariants: Variants = {
        maximized: {
            width: "100vw",
            height: "100vh",
            borderRadius: "0px",
            y: 0,
            x: 0,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            position: "fixed",
            zIndex: 9999,
            backgroundColor: "#000000",
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
            borderRadius: "0px 0px 24px 24px",
            y: 0,
            x: "-50%",
            top: 0,
            left: "50%",
            right: "auto",
            bottom: "auto",
            position: "fixed",
            zIndex: 1001, // Keep it high but compatible with SiteHeader (z-[1000])
            backgroundColor: "#000000",
            backdropFilter: "blur(20px)",
            borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.3)",
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
                initial={false}
                animate={isMinimized ? "minimized" : "maximized"}
                variants={containerVariants}
                className={`shadow-2xl overflow-hidden bg-black text-white ${isMinimized ? 'cursor-pointer' : ''}`}
                onClick={isMinimized ? handleMaximize : undefined}
                style={{ originY: 0 }}
            >
                {/* Background (Only visible in maximized state) */}
                <motion.div
                    animate={{ opacity: isMinimized ? 0 : 1 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 z-0 pointer-events-none"
                    style={{ width: '100%', height: '100%' }}
                >
                    {/* Desktop Media */}
                    {settings.intro_media_url && (
                        <div className={`absolute inset-0 hidden ${settings.intro_media_url_mobile ? 'md:block' : 'block'}`}>
                            {settings.intro_media_url.endsWith('.mp4') || settings.intro_media_url.endsWith('.webm') ? (
                                <video src={settings.intro_media_url} autoPlay muted loop playsInline className="w-full h-full object-cover opacity-60" />
                            ) : (
                                <NextImage
                                    src={settings.intro_media_url}
                                    alt="Intro Desktop"
                                    fill
                                    priority
                                    unoptimized // Serve original file directly to prevent double-compression/quality loss
                                    className="object-cover opacity-60"
                                    sizes="100vw"
                                />
                            )}
                        </div>
                    )}

                    {/* Mobile Media */}
                    {settings.intro_media_url_mobile && (
                        <div className="absolute inset-0 block md:hidden">
                            {settings.intro_media_url_mobile.endsWith('.mp4') || settings.intro_media_url_mobile.endsWith('.webm') ? (
                                <video src={settings.intro_media_url_mobile} autoPlay muted loop playsInline className="w-full h-full object-cover opacity-60" />
                            ) : (
                                <NextImage
                                    src={settings.intro_media_url_mobile}
                                    alt="Intro Mobile"
                                    fill
                                    priority
                                    unoptimized // Serve original file directly
                                    className="object-cover opacity-60"
                                    sizes="100vw"
                                />
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
                <div className="relative z-10 w-full h-full font-sans">
                    {!isMinimized ? (
                        <motion.div
                            key="full-content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="w-full h-full relative"
                        >
                            {/* TOP 20% AREA: Contact Pill */}
                            <div className="absolute top-0 left-0 w-full h-[20%] flex items-center justify-center z-[60]">
                                {/* Desktop Interaction Div (Click to Reveal -> Click to Call) */}
                                {showNumber ? (
                                    <a
                                        href={`tel:${settings.intro_contact_phone}`}
                                        className="hidden md:flex bg-transparent border border-white/80 rounded-full px-6 py-2 items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors backdrop-blur-sm"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Phone className="w-4 h-4 text-white" />
                                        <span className="text-sm font-bold tracking-widest uppercase text-white">
                                            {settings.intro_contact_phone}
                                        </span>
                                    </a>
                                ) : (
                                    <div
                                        onClick={handleContactClick}
                                        className="hidden md:flex bg-transparent border border-white/80 rounded-full px-6 py-2 items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors backdrop-blur-sm"
                                    >
                                        <Phone className="w-4 h-4 text-white" />
                                        <span className="text-sm font-bold tracking-widest uppercase text-white">
                                            SKONTAKTUJ SIĘ
                                        </span>
                                    </div>
                                )}

                                {/* Mobile Link (Direct Call) */}
                                <a
                                    href={`tel:${settings.intro_contact_phone}`}
                                    className="flex md:hidden bg-transparent border border-white/80 rounded-full px-6 py-3 items-center gap-3 cursor-pointer active:scale-95 transition-transform backdrop-blur-sm"
                                >
                                    <Phone className="w-4 h-4 text-white" />
                                    <span className="text-xs font-bold tracking-widest uppercase text-white">
                                        SKONTAKTUJ SIĘ
                                    </span>
                                </a>
                            </div>

                            {/* BOTTOM 80% AREA: Dismiss Interaction */}
                            <div
                                className="absolute bottom-0 left-0 w-full h-[80%] z-[50] cursor-pointer group flex flex-col items-center"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMinimize();
                                }}
                            >
                                {/* Hint Text at 75% from TOP (which is roughly near bottom of this container) */}
                                {/* 75% from top means top: 75% */}
                                <div className="absolute top-[75%] transform -translate-y-1/2 flex flex-col items-center justify-center gap-4 animate-pulse pointer-events-none">
                                    <span className="text-white/80 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] group-hover:text-white transition-colors">
                                        Zacznij wyszukiwanie
                                    </span>
                                    <ArrowDown className="w-5 h-5 text-white/60 animate-bounce group-hover:text-white transition-colors" />
                                </div>

                                {/* Branding at absolute bottom */}
                                <span className="absolute bottom-8 text-[9px] text-white/30 uppercase tracking-[0.3em] font-light pointer-events-none">
                                    lukilot.work
                                </span>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="notch-content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="flex items-center gap-4 px-6 py-3 min-w-[200px] justify-between text-nowrap"
                        >
                            {/* Left Side: Phone + Kontakt */}
                            <div className="flex items-center gap-3 text-white">
                                <Phone className="w-3 h-3" />
                                <span className="text-[10px] uppercase font-bold tracking-[0.15em] leading-none">
                                    Kontakt
                                </span>
                            </div>

                            {/* Right Side: Divider + Chevron */}
                            <div className="flex items-center gap-3">
                                <div className="w-px h-3 bg-white/20" />
                                <ChevronDown className="w-3 h-3 text-white/50 group-hover:text-white transition-colors" />
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
