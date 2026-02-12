'use client';

import { Phone, Mail, ArrowRight, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function SearchFooter() {
    return (
        <div className="w-full mt-24 mb-16 px-4 md:px-0">
            <div className="relative w-full overflow-hidden rounded-sm group cursor-default">

                {/* Background Image - Full Cover */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/images/car-cover.png"
                        alt="Background"
                        fill
                        className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                    />
                    {/* Heavy Dark Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/80 to-black/40" />
                    <div className="absolute inset-0 bg-black/20" /> {/* Extra tint */}
                </div>

                {/* Content Container */}
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 md:p-16 gap-12">

                    {/* Left Side: Headline & Copy */}
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
                                Indywidualne Zamówienie
                            </span>
                        </div>

                        <h3 className="text-3xl md:text-5xl font-light text-white mb-6 tracking-tight leading-tight">
                            Nie znalazłeś<br />
                            <span className="font-semibold text-white/90">poszukiwanego modelu?</span>
                        </h3>

                        <p className="text-sm md:text-base text-gray-300 font-light leading-relaxed max-w-xl border-l-2 border-white/20 pl-6">
                            Oferta na stronie może nie obejmować wszystkich dostępnych pojazdów.
                            Skontaktuj się z nami bezpośrednio – sprawdzimy dostępność i przygotujemy ofertę indywidualną.
                        </p>
                    </div>

                    {/* Right Side: Actions */}
                    <div className="flex flex-col gap-4 w-full md:w-auto min-w-[300px]">
                        <div className="p-6 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors rounded-sm group/card">
                            <h4 className="text-white text-lg font-light mb-4">Skontaktuj się z Dealerem</h4>

                            <div className="space-y-3">
                                <a
                                    href="tel:+48508020612"
                                    className="flex items-center justify-between group/btn py-3 border-b border-white/10 hover:border-white/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover/btn:bg-white group-hover/btn:text-black transition-colors text-white">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-white tracking-wide">+48 508 020 612</span>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-white/40 group-hover/btn:text-white transition-colors" />
                                </a>

                                <a
                                    href="mailto:lotoszynski_l@bmw-bawariamotors.pl"
                                    className="flex items-center justify-between group/btn py-3 border-b border-transparent hover:border-white/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover/btn:bg-white group-hover/btn:text-black transition-colors text-white">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-white tracking-wide">Wyślij wiadomość</span>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-white/40 group-hover/btn:text-white transition-colors" />
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
