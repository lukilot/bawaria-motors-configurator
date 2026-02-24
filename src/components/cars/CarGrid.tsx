'use client';

import { useEffect, useRef } from 'react';
import { StockCar } from '@/types/stock';
import { CarRow } from '@/components/cars/CarRow';
import { CarCard } from '@/components/cars/CarCard';
import { SlidersHorizontal, LayoutGrid, List, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchFooter } from './SearchFooter';

interface DictionaryItem {
    name?: string;
    [key: string]: unknown;
}

interface CarGridProps {
    cars: StockCar[];
    totalCount?: number;
    onOpenFilters?: () => void;
    isFiltersOpen?: boolean;
    sortOrder?: 'newest' | 'price_asc' | 'price_desc';
    onSortChange?: (order: 'newest' | 'price_asc' | 'price_desc') => void;
    dictionaries: {
        model: Record<string, DictionaryItem>;
        color: Record<string, DictionaryItem>;
        upholstery: Record<string, DictionaryItem>;
        option: Record<string, DictionaryItem>;
        drivetrain: Record<string, DictionaryItem>;
    };
    bulletinPrices?: Record<string, number>;
    // Lifted state — managed and persisted by SRPLayout
    layout: 'grid' | 'list';
    onLayoutChange: (l: 'grid' | 'list') => void;
    displayCount: number;
    onDisplayCountChange: (n: number) => void;
}

export function CarGrid({
    cars,
    onOpenFilters,
    isFiltersOpen,
    dictionaries,
    sortOrder = 'newest',
    onSortChange,
    bulletinPrices,
    layout,
    onLayoutChange,
    displayCount,
    onDisplayCountChange,
}: CarGridProps) {
    const observerTarget = useRef<HTMLDivElement>(null);

    // Clamp displayCount to actual list size when cars change (e.g. filter applied)
    useEffect(() => {
        if (displayCount > cars.length) {
            onDisplayCountChange(Math.max(12, cars.length));
        }
    }, [cars.length]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && displayCount < cars.length) {
                    onDisplayCountChange(displayCount + 12);
                }
            },
            { threshold: 0.1, rootMargin: '200px' }
        );

        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [displayCount, cars.length, onDisplayCountChange]);

    return (
        <div className="w-full relative">
            {/* Mobile Filter Button */}
            {!isFiltersOpen && (
                <div className="lg:hidden fixed bottom-8 left-6 right-6 z-[100]">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onOpenFilters?.(); }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-sm shadow-xl"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filtry i Sortowanie
                    </button>
                </div>
            )}

            {/* SRP Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-gray-100 gap-4">
                <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">
                        {cars.length} Wyników
                    </span>
                </div>

                <div className="flex items-center gap-6 justify-end w-full md:w-auto">
                    {/* Sort Dropdown */}
                    <div className="relative group mr-4 flex items-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-right mr-2 cursor-pointer group-hover:text-gray-600 transition-colors">
                            {sortOrder === 'newest' && 'Najnowsze'}
                            {sortOrder === 'price_asc' && 'Cena: Rosnąco'}
                            {sortOrder === 'price_desc' && 'Cena: Malejąco'}
                        </span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                        <select
                            value={sortOrder}
                            onChange={(e) => onSortChange?.(e.target.value as any)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        >
                            <option value="newest">Najnowsze</option>
                            <option value="price_asc">Cena: Rosnąco</option>
                            <option value="price_desc">Cena: Malejąco</option>
                        </select>
                    </div>

                    {/* Desktop Layout Toggle */}
                    <div className="hidden md:flex bg-gray-50 p-1 rounded-sm border border-gray-100">
                        <button
                            onClick={() => onLayoutChange('grid')}
                            className={cn("p-1.5 transition-all rounded-sm", layout === 'grid' ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600")}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onLayoutChange('list')}
                            className={cn("p-1.5 transition-all rounded-sm", layout === 'list' ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600")}
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {cars.length === 0 ? (
                <div className="text-center py-32 bg-white border border-dashed border-gray-200 rounded-sm">
                    <h3 className="text-xl font-light text-gray-400">Nie znaleziono pojazdów.</h3>
                    <p className="text-gray-400 text-sm mt-2">Spróbuj zmienić filtry lub wyszukiwaną frazę.</p>
                </div>
            ) : (
                <>
                    {layout === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {cars.slice(0, displayCount).map(car => (
                                <CarCard
                                    key={car.vin}
                                    car={car}
                                    modelName={dictionaries.model[car.model_code]?.name || car.model_name}
                                    colorName={dictionaries.color[car.color_code]?.name}
                                    upholsteryName={dictionaries.upholstery[car.upholstery_code]?.name}
                                    individualColorName={car.individual_color ? dictionaries.color[car.individual_color]?.name : undefined}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {cars.slice(0, displayCount).map(car => (
                                <CarRow
                                    key={car.vin}
                                    car={car}
                                    modelName={dictionaries.model[car.model_code]?.name || car.model_name || `BMW ${car.model_code}`}
                                    dictionaries={dictionaries}
                                    discountedPrice={bulletinPrices?.[car.vin]}
                                />
                            ))}
                        </div>
                    )}

                    {displayCount < cars.length && (
                        <div ref={observerTarget} className="mt-12 text-center py-8">
                            <span className="text-xs text-gray-400 block uppercase tracking-widest animate-pulse">
                                Ładowanie kolejnych pojazdów...
                            </span>
                        </div>
                    )}
                </>
            )}

            <SearchFooter />
        </div>
    );
}
