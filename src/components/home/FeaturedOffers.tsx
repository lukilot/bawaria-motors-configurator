'use client';

import { StockCar } from '@/types/stock';
import { CarCard } from '@/components/cars/CarCard';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface FeaturedOffersProps {
    cars: StockCar[];
    dictionaries: any;
}

export function FeaturedOffers({ cars, dictionaries }: FeaturedOffersProps) {
    if (cars.length === 0) return null;

    return (
        <section className="py-32 bg-white">
            <div className="max-w-[1600px] mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
                    <div className="max-w-xl">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-6 block"
                        >
                            Wyróżnione okazje
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="text-4xl md:text-5xl font-light tracking-tight text-gray-900"
                        >
                            Wybrane dla <span className="italic font-medium">Ciebie.</span>
                        </motion.h2>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <Link
                            href="/cars"
                            className="group flex items-center gap-4 py-3 px-8 rounded-full border border-gray-100 hover:border-gray-900 transition-all duration-300"
                        >
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-gray-900">
                                Zobacz wszystkie oferty
                            </span>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                        </Link>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {cars.slice(0, 3).map((car, idx) => (
                        <motion.div
                            key={car.vin}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                        >
                            <CarCard
                                car={car}
                                modelName={dictionaries.model[car.model_code]?.name}
                                colorName={dictionaries.color[car.color_code]?.name}
                                upholsteryName={dictionaries.upholstery[car.upholstery_code]?.name}
                                individualColorName={car.individual_color ? dictionaries.color[car.individual_color]?.name : undefined}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
