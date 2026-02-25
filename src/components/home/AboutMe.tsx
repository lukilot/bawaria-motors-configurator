'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Smartphone, Mail, MapPin } from 'lucide-react';

export function AboutMe() {
    return (
        <section className="py-32 bg-gray-50 overflow-hidden">
            <div className="max-w-[1600px] mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    {/* Image Column - Elegant & Artistic */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative group"
                    >
                        <div className="aspect-[4/5] rounded-sm overflow-hidden bg-gray-200 relative">
                            <Image
                                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop"
                                alt="Twoje Doradztwo Premium"
                                fill
                                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                            />
                            {/* Decorative Glass Overlay */}
                            <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:opacity-0" />
                        </div>

                        {/* Signature Element */}
                        <div className="absolute -bottom-10 -right-10 w-64 h-64 border border-black/5 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-3xl z-10 hidden md:flex">
                            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-black/40 text-center px-12 leading-relaxed">
                                Zaufanie <br /> Budowane na <br /> Pasji
                            </span>
                        </div>
                    </motion.div>

                    {/* Text Column */}
                    <div className="flex flex-col gap-12">
                        <div>
                            <motion.span
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-6 block"
                            >
                                Filozofia Doradztwa
                            </motion.span>
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="text-4xl md:text-5xl font-light tracking-tight text-gray-900 leading-[1.1]"
                            >
                                Więcej niż salon. <br />
                                <span className="italic font-medium">Osobiste doradztwo.</span>
                            </motion.h2>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="flex flex-col gap-8"
                        >
                            <p className="text-lg text-gray-500 font-light leading-relaxed">
                                W Bawaria Motors wierzę, że zakup samochodu klasy premium to nie transakcja, a początek nowej relacji. Moja rola polega na dostarczeniu Ci nie tylko kluczyków, ale pewności, że dokonany wybór jest idealnym odzwierciedleniem Twojego stylu życia.
                            </p>
                            <p className="text-base text-gray-400 font-light leading-relaxed">
                                Specjalizuję się w konfiguracjach BMW Individual oraz limitowanych edycjach M Performance. Każdy projekt traktuję jak wspólne dzieło, dbając o każdy detal — od koloru lakieru po unikalny charakter Twojego nowego BMW.
                            </p>
                        </motion.div>

                        {/* Contact Quick Links */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="flex flex-wrap gap-8 pt-8 border-t border-gray-200"
                        >
                            <div className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300">
                                    <Smartphone className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="block text-[8px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Telefon</span>
                                    <span className="text-sm font-medium text-gray-900">+48 123 456 789</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-300">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="block text-[8px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Email</span>
                                    <span className="text-sm font-medium text-gray-900">kontakt@bawariamotors.pl</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
