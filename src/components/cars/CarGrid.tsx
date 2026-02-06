import { useState } from 'react';
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





    return (
        <div className="w-full">
            {/* SRP Top Bar */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onOpenFilters}
                        className="lg:hidden flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-sm"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filtry
                    </button>
                </div>

                <div className="flex items-center gap-6">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-widest mr-4">
                        {cars.length} Wyników
                    </span>

                    <div className="flex bg-gray-50 p-1 rounded-sm border border-gray-100">
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
            ) : layout === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {cars.map(car => (
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
                    {cars.map(car => (
                        <CarRow
                            key={car.vin}
                            car={car}
                            modelName={dictionaries.model[car.model_code]?.name || car.model_name || `BMW ${car.model_code}`}
                            dictionaries={dictionaries}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
