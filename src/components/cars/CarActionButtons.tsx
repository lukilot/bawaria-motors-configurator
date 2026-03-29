'use client';

import { useState, useEffect } from 'react';
import { Warehouse, Scale } from 'lucide-react';
import { useGarageStore } from '@/store/garageStore';
import { useCompareStore } from '@/store/compareStore';
import { StockCar } from '@/types/stock';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

interface CarActionButtonsProps {
    car: StockCar;
    className?: string;
}

export function CarActionButtons({ car, className }: CarActionButtonsProps) {
    const { addCar: addGarageCar, removeCar: removeGarageCar } = useGarageStore();
    const { compareCars, addCar: addCompareCar, removeCar: removeCompareCar } = useCompareStore();
    const haptics = useHaptics();

    // Direct selectors — Zustand tracks these precisely and re-renders on change
    const isCarSaved = useGarageStore(state => state.savedCars.some(c => c.vin === car.vin));
    const isCarCompared = useCompareStore(state => state.compareCars.some(c => c.vin === car.vin));

    // Mounted guard — persist rehydrates asynchronously; this ensures we don't show stale SSR state
    const [clientMounted, setClientMounted] = useState(false);
    useEffect(() => { setClientMounted(true); }, []);

    const saved = clientMounted && isCarSaved;
    const compared = clientMounted && isCarCompared;

    const toggleGarage = () => {
        if (saved) {
            removeGarageCar(car.vin);
            haptics.medium();
        } else {
            addGarageCar(car);
            haptics.success();
        }
    };

    const toggleCompare = () => {
        if (compared) {
            removeCompareCar(car.vin);
            haptics.medium();
        } else {
            if (compareCars.length >= 3) {
                haptics.error();
                alert('Możesz porównywać maksymalnie 3 samochody jednocześnie.');
                return;
            }
            addCompareCar(car);
            haptics.success();
        }
    };

    return (
        <div className={cn('flex items-center gap-4', className)}>
            <button
                onClick={toggleGarage}
                className={cn(
                    'flex flex-1 items-center justify-center gap-3 px-4 py-4 rounded-xl border transition-all duration-300 text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer active:scale-95 shadow-sm',
                    saved
                        ? 'bg-black text-white border-black shadow-lg shadow-black/10'
                        : 'bg-white text-gray-900 border-gray-100 hover:border-black/20 hover:shadow-md'
                )}
                title={saved ? 'Usuń z garażu' : 'Dodaj do garażu'}
            >
                <Warehouse className={cn("w-4 h-4", saved ? "text-white" : "text-gray-400")} />
                {saved ? 'W Garażu' : 'Do Garażu'}
            </button>
            
            <button
                onClick={toggleCompare}
                className={cn(
                    'flex flex-1 items-center justify-center gap-3 px-4 py-4 rounded-xl border transition-all duration-300 text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer active:scale-95 shadow-sm',
                    compared
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20'
                        : 'bg-white text-gray-900 border-gray-100 hover:border-black/20 hover:shadow-md'
                )}
                title={compared ? 'Usuń z porównania' : 'Porównaj'}
            >
                <Scale className={cn("w-4 h-4", compared ? "text-white" : "text-gray-400")} />
                {compared ? 'Wybrane' : 'Porównaj'}
            </button>
        </div>
    );
}
