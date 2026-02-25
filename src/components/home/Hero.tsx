'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, MoveRight } from 'lucide-react';
import { BMWIndividualBadge } from '@/components/cars/BMWIndividualBadge';
import { cn } from '@/lib/utils';

export function Hero() {
    return (
        <section className="relative w-full h-[90vh] min-h-[700px] overflow-hidden bg-black flex items-center">
            {/* Background Image - Cinematic & Dark */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="https://images.unsplash.com/photo-1617469767053-d3b508a042a2?q=80&w=2072&auto=format&fit=crop"
                    alt="BMW Individual Showroom"
                    fill
                    className="object-cover opacity-80"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
            </div>

            <div className="container mx-auto px-6 relative z-10 pt-20">
                <div className="max-w-4xl">
                    {/* Upper Category Label */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex items-center gap-4 mb-8"
                    >
                        <div className="w-12 h-[1px] bg-white/40" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/50">
                            The M Performance Collection
                        </span>
                    </motion.div>

                    {/* Main Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="text-6xl md:text-8xl font-light text-white tracking-[-0.03em] leading-[0.9] mb-12"
                    >
                        Definicja <br />
                        <span className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40">Premium.</span>
                    </motion.h1>

                    {/* Feature Card - Glassmorphism */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col md:flex-row items-end gap-12"
                    >
                        <div className="relative p-8 rounded-sm bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl max-w-sm">
                            <BMWIndividualBadge colorName="Frozen Marina Bay Blue" className="mb-6" />
                            <h2 className="text-2xl font-light text-white mb-4">Nowy BMW M5</h2>
                            <p className="text-sm text-white/60 leading-relaxed mb-8">
                                Odkryj esencję sportowej elegancji. Egzemplarz w unikatowym lakierze Individual, dostępny do natychmiastowego odbioru.
                            </p>

                            <Link
                                href="/cars"
                                className="group inline-flex items-center gap-4 text-white hover:text-white/80 transition-colors"
                            >
                                <span className="text-xs font-bold uppercase tracking-[0.2em]">Szczegóły oferty</span>
                                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-500">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </Link>

                            {/* Floating Stats */}
                            <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-white/10">
                                <div>
                                    <span className="block text-[8px] font-bold uppercase tracking-widest text-white/40 mb-1">Moc silnika</span>
                                    <span className="text-xl font-medium text-white">600 KM</span>
                                </div>
                                <div>
                                    <span className="block text-[8px] font-bold uppercase tracking-widest text-white/40 mb-1">Status</span>
                                    <span className="text-xl font-medium text-white">Dostępny</span>
                                </div>
                            </div>
                        </div>

                        {/* Secondary CTA */}
                        <div className="pb-8">
                            <Link
                                href="/cars"
                                className="group flex items-center gap-6"
                            >
                                <span className="text-xs font-bold text-white/40 uppercase tracking-[0.4em] transition-colors group-hover:text-white">
                                    Pełna Oferta Bawaria Motors
                                </span>
                                <MoveRight className="w-6 h-6 text-white/20 group-hover:text-white group-hover:translate-x-4 transition-all duration-700" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Bottom Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
            >
                <div className="w-[1px] h-12 bg-gradient-to-t from-white/40 to-transparent" />
                <span className="text-[8px] font-bold uppercase tracking-[0.5em] text-white/20">Scroll</span>
            </motion.div>
        </section>
    );
}
