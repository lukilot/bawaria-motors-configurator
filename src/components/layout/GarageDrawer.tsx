'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useGarageStore } from '@/store/garageStore';
import { useCompareStore } from '@/store/compareStore';
import { cn } from '@/lib/utils';
import { X, Trash2, ArrowRight, Warehouse, Scale } from 'lucide-react';

export function GarageDrawer() {
    const { isOpen, closeGarage, savedCars, removeCar } = useGarageStore();
    const { compareCars, addCar: addCompareCar, removeCar: removeCompareCar } = useCompareStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!mounted) return null;

    const formatPrice = (price: number, currency: string) =>
        new Intl.NumberFormat('pl-PL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity duration-300",
                    isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                )}
                onClick={closeGarage}
            />

            {/* Drawer */}
            <div
                className={cn(
                    "fixed top-0 right-0 h-full bg-white shadow-2xl z-[130] transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
                style={{ width: '100%', maxWidth: 420 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center">
                            <Warehouse className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold tracking-tight text-gray-900">Twój Garaż</h2>
                            <p className="text-xs text-gray-500">{savedCars.length} {savedCars.length === 1 ? 'pojazd' : savedCars.length < 5 ? 'pojazdy' : 'pojazdów'}</p>
                        </div>
                    </div>
                    <button
                        onClick={closeGarage}
                        className="p-2 text-gray-500 hover:text-black hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                    {savedCars.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-16">
                            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-2">
                                <Warehouse className="w-9 h-9 text-gray-300" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Garaż jest pusty</h3>
                            <p className="text-sm text-gray-500 max-w-[240px] leading-relaxed">
                                Dodaj ulubione auta do garażu, aby łatwo do nich wrócić.
                            </p>
                        </div>
                    ) : (
                        savedCars.map(car => {
                            const modelName = car.model_name || `BMW ${car.model_code}`;
                            const price = car.special_price || car.list_price;
                            const hasDiscount = car.special_price && car.special_price < car.list_price;
                            const isCompared = compareCars.some(c => c.vin === car.vin);

                            const toggleCompare = (e: React.MouseEvent) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (isCompared) {
                                    removeCompareCar(car.vin);
                                } else {
                                    if (compareCars.length >= 3) {
                                        alert('Możesz porównywać maksymalnie 3 samochody jednocześnie.');
                                        return;
                                    }
                                    addCompareCar(car);
                                }
                            };

                            return (
                                <div
                                    key={car.vin}
                                    className="group relative flex gap-4 p-4 border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-md transition-all bg-white"
                                >
                                    {/* Compare Toggle - Integrated on the left */}
                                    <div className="flex items-center -ml-1 pr-1 border-r border-gray-50">
                                        <button
                                            onClick={toggleCompare}
                                            className={cn(
                                                "w-8 h-8 flex items-center justify-center rounded-lg transition-all",
                                                isCompared
                                                    ? "bg-blue-600 text-white shadow-sm"
                                                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                            )}
                                            title={isCompared ? "Usuń z porównania" : "Dodaj do porównania"}
                                        >
                                            <Scale className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Image */}
                                    <div className="w-24 h-16 sm:w-28 sm:h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                        {car.images && car.images.length > 0 ? (
                                            <img
                                                src={car.images[0].url}
                                                alt={modelName}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <img src="/images/car-cover.png" alt="" className="w-full h-full object-cover opacity-50" />
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex flex-col flex-1 min-w-0 py-0.5">
                                        <h4 className="font-bold text-sm text-gray-900 leading-tight pr-6 truncate">{modelName}</h4>
                                        <p className="text-[10px] text-gray-400 font-mono mt-0.5 mb-auto">{car.vin}</p>

                                        {/* Price block */}
                                        <div className="mt-2">
                                            {hasDiscount ? (
                                                <div>
                                                    <p className="text-[10px] text-gray-400 line-through leading-none">
                                                        {formatPrice(car.list_price, car.currency)}
                                                    </p>
                                                    <p className="text-base font-bold text-gray-900 leading-tight">
                                                        {formatPrice(car.special_price!, car.currency)}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-base font-bold text-gray-900 leading-tight">
                                                    {formatPrice(price, car.currency)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Remove */}
                                    <button
                                        onClick={() => removeCar(car.vin)}
                                        className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Usuń z garażu"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>

                                    {/* View link */}
                                    <Link
                                        href={`/cars/${car.vin}`}
                                        onClick={closeGarage}
                                        className="absolute bottom-3 right-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors"
                                    >
                                        Pokaż <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                {savedCars.length > 0 && (
                    <div className="p-5 border-t border-gray-200 bg-gray-50 flex flex-col gap-2">
                        <Link
                            href="/"
                            onClick={closeGarage}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors rounded-xl"
                        >
                            Wróć do wyszukiwania
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}
