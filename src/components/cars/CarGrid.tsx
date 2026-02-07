import { useState, useEffect, useRef } from 'react';
import { StockCar } from '@/types/stock';
import { CarRow } from '@/components/cars/CarRow';
import { CarCard } from '@/components/cars/CarCard';
import { SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DictionaryItem {
    name?: string;
    [key: string]: unknown;
}

interface CarGridProps {
    cars: StockCar[];
    totalCount?: number;
    onOpenFilters?: () => void;
    dictionaries: {
        model: Record<string, DictionaryItem>;
        color: Record<string, DictionaryItem>;
        upholstery: Record<string, DictionaryItem>;
        option: Record<string, DictionaryItem>;
        drivetrain: Record<string, DictionaryItem>;
    };
}

export function CarGrid({ cars, onOpenFilters, dictionaries }: CarGridProps) {



    const [layout, setLayout] = useState<'grid' | 'list'>('list'); // Default to list because it shows more detail
    const [displayCount, setDisplayCount] = useState(12);
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && displayCount < cars.length) {
                    setDisplayCount(prev => prev + 12);
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [displayCount, cars.length]);





    return (
        <div className="w-full relative">
            {/* Mobile Filter Button - Floating at Bottom with high Z-index to prevent click-through */}
            <div className="lg:hidden fixed bottom-8 left-6 right-6 z-[100]">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpenFilters();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-sm shadow-xl"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filtry i Sortowanie
                </button>
            </div>

            {/* SRP Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-gray-100 gap-4">
                <div className="flex items-center gap-6 justify-between w-full md:w-auto">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-widest mr-4">
                        {cars.length} Wyników
                    </span>

                    {/* Desktop Layout Toggle (Hidden on Mobile) */}
                    <div className="hidden md:flex bg-gray-50 p-1 rounded-sm border border-gray-100">
                        <button
                            onClick={() => setLayout('grid')}
                            className={cn(
                                "p-1.5 transition-all rounded-sm",
                                layout === 'grid' ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setLayout('list')}
                            className={cn(
                                "p-1.5 transition-all rounded-sm",
                                layout === 'list' ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Layout */}
            {cars.length === 0 ? (
                <div className="text-center py-32 bg-white border border-dashed border-gray-200 rounded-sm">
                    <h3 className="text-xl font-light text-gray-400">No vehicles found.</h3>
                    <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search query.</p>
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
                                />
                            ))}
                        </div>
                    )}

                    {displayCount < cars.length && (
                        <div
                            ref={observerTarget}
                            className="mt-12 text-center py-8"
                        >
                            <span className="text-xs text-gray-400 block uppercase tracking-widest animate-pulse">
                                Ładowanie kolejnych pojazdów...
                            </span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
