'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    ArrowLeft,
    Warehouse,
    ChevronDown,
    X,
    Save,
    LogOut,
    LayoutDashboard,
    Library,
    Coins,
    Tag,
    Car,
    Search
} from 'lucide-react';
import { useGarageStore } from '@/store/garageStore';
import { useVdpStore } from '@/store/vdpStore';
import { useAdminStore, AdminView } from '@/store/adminStore';
import { motion, AnimatePresence } from 'framer-motion';

export function SiteHeader() {
    const [isScrolled, setIsScrolled] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { savedCars, toggleGarage, isOpen: isGarageOpen } = useGarageStore();
    const { currentCar, siblings } = useVdpStore();
    const { currentView, setView, isDirty } = useAdminStore();
    const count = savedCars.length;

    const isVdp = pathname.startsWith('/cars/');
    const isAdmin = pathname.startsWith('/admin');
    const isMSeries = currentCar?.series?.includes('Seria M') || currentCar?.model_code?.startsWith('M');
    const totalAvailable = siblings?.length || 0; // siblings already includes current car

    const [isSearchOpen, setIsSearchOpen] = useState(false);

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
                "fixed top-0 left-0 right-0 z-[1000] transition-all duration-500 ease-in-out px-4 md:px-12",
                isAdmin
                    ? "py-3 bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm"
                    : isVdp
                        ? "py-3 bg-transparent border-transparent backdrop-blur-none border-b-0"
                        : isScrolled
                            ? "py-3 bg-white/70 backdrop-blur-2xl border-b border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
                            : "py-6 md:py-8 bg-transparent border-b border-transparent"
            )}
        >
            <div className={cn(
                "max-w-[1600px] mx-auto px-6 flex items-center justify-between",
                isVdp ? "" : "h-16"
            )}>
                {isAdmin ? (
                    <>
                        {/* Admin Left: Logo & Exit */}
                        <div className="flex items-center gap-6">
                            <Link href="/admin" className="group flex flex-col items-start translate-y-1">
                                <h1 className="text-lg md:text-xl font-bold tracking-tighter text-gray-900">
                                    lukilot<span className="text-blue-600 transition-colors">.admin</span>
                                </h1>
                            </Link>

                            <div className="w-px h-6 bg-gray-200" />

                            {pathname !== '/admin' ? (
                                <button
                                    onClick={() => router.back()}
                                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-900 hover:text-blue-600 transition-colors"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    Wróć
                                </button>
                            ) : (
                                <Link
                                    href="/"
                                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Podgląd stron
                                </Link>
                            )}
                        </div>

                        {/* Admin Middle: Navigation */}
                        <nav className="hidden lg:flex items-center bg-black/[0.03] p-1 rounded-full border border-black/[0.05]">
                            {[
                                { id: 'stock', label: 'Stock', icon: LayoutDashboard },
                                { id: 'dictionaries', label: 'Knowledge Base', icon: Library },
                                { id: 'pricing', label: 'Pakiety', icon: Coins },
                                { id: 'bulletins', label: 'Warunki', icon: Tag },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setView(item.id as AdminView)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-full",
                                        currentView === item.id
                                            ? "bg-white text-black shadow-sm"
                                            : "text-gray-500 hover:text-gray-900"
                                    )}
                                >
                                    <item.icon className="w-3.5 h-3.5" />
                                    {item.label}
                                </button>
                            ))}
                        </nav>

                        {/* Admin Right: Actions */}
                        <div className="flex items-center gap-3">
                            <motion.button
                                initial={false}
                                onClick={() => isDirty && useAdminStore.getState().onSave?.()}
                                animate={{
                                    opacity: isDirty ? 1 : 0.5,
                                    scale: isDirty ? 1 : 0.95
                                }}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-500",
                                    isDirty
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95"
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                )}
                            >
                                <Save className="w-3.5 h-3.5" />
                                Zapisz zmiany
                            </motion.button>
                        </div>
                    </>
                ) : (
                    <>
                        <AnimatePresence>
                            {!isSearchOpen && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex items-center gap-4"
                                >
                                    {/* VDP Back Button (Mobile Only) - Floating Style */}
                                    {isVdp && (
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => {
                                                const lastSrp = sessionStorage.getItem('bawaria_last_srp');
                                                router.push(lastSrp || '/cars');
                                            }}
                                            className={cn(
                                                "flex lg:hidden items-center justify-center w-12 h-12 rounded-full border transition-all shadow-xl absolute top-5 left-6",
                                                isMSeries ? "bg-white text-black border-white" : "bg-black text-white border-black"
                                            )}
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </motion.button>
                                    )}

                                    {/* Garage Toggle Button (Mobile Only) - Floating Style */}
                                    {isVdp && (
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={toggleGarage}
                                            className={cn(
                                                "flex lg:hidden items-center justify-center w-12 h-12 rounded-full border transition-all shadow-xl absolute top-5 right-6",
                                                isMSeries ? "bg-white text-black border-white" : "bg-black text-white border-black"
                                            )}
                                        >
                                            <div className="relative">
                                                <Warehouse className="w-5 h-5" />
                                                {count > 0 && (
                                                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-blue-600 text-[9px] font-black text-white flex items-center justify-center border-2 border-white">
                                                        {count}
                                                    </span>
                                                )}
                                            </div>
                                        </motion.button>
                                    )}

                                    {/* Desktop: Back Button on Left (only on VDP) */}
                                    {isVdp && (
                                        <div className="hidden lg:flex items-center">
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => {
                                                    const lastSrp = sessionStorage.getItem('bawaria_last_srp');
                                                    router.push(lastSrp || '/cars');
                                                }}
                                                className={cn(
                                                    "flex items-center justify-center w-12 h-12 rounded-full border transition-all shadow-xl",
                                                    isMSeries ? "bg-white text-black border-white" : "bg-black text-white border-black"
                                                )}
                                            >
                                                <ArrowLeft className="w-5 h-5" />
                                            </motion.button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Middle Slot - Always hidden on SRP/VDP for now unless search is active */}
                        <div className="flex-1" />


                        <div className="hidden lg:flex items-center gap-3 md:gap-4">
                            {/* Garage Button — always visible in desktop header */}
                            <button
                                onClick={toggleGarage}
                                className={cn(
                                    "relative flex items-center gap-2.5 px-4 py-2.5 rounded-full transition-all duration-500 text-[10px] font-bold uppercase tracking-[0.15em] border group/btn",
                                    isGarageOpen
                                        ? "opacity-0 pointer-events-none translate-x-4"
                                        : count > 0
                                            ? "border-black bg-black text-white hover:bg-gray-800"
                                            : isScrolled
                                                ? "border-black/5 bg-black/5 text-gray-900 hover:bg-black hover:text-white"
                                                : isMSeries
                                                    ? "border-white/20 bg-white/10 text-white hover:bg-white hover:text-black"
                                                    : "border-black/10 bg-white/10 text-gray-900 hover:bg-black hover:text-white"
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Warehouse className="w-3.5 h-3.5 transition-transform duration-500 group-hover/btn:scale-110" />
                                    <span className="hidden sm:inline">Garaż</span>
                                </div>

                                {count > 0 && (
                                    <span className="bg-white text-black text-[9px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full font-bold leading-none shadow-sm ml-1">
                                        {count}
                                    </span>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </motion.header>
    );
}
