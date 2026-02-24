'use client';

import { useState, useEffect } from 'react';
import { Warehouse, Scale } from 'lucide-react';
import { useGarageStore } from '@/store/garageStore';
import { useCompareStore } from '@/store/compareStore';
import { StockCar } from '@/types/stock';
import { cn } from '@/lib/utils';

interface CarActionButtonsProps {
    car: StockCar;
    className?: string;
}

export function CarActionButtons({ car, className }: CarActionButtonsProps) {
    const { addCar: addGarageCar, removeCar: removeGarageCar } = useGarageStore();
    const { compareCars, addCar: addCompareCar, removeCar: removeCompareCar } = useCompareStore();

    // Direct selectors — Zustand tracks these precisely and re-renders on change
    const isCarSaved = useGarageStore(state => state.savedCars.some(c => c.vin === car.vin));
    const isCarCompared = useCompareStore(state => state.compareCars.some(c => c.vin === car.vin));

    // Mounted guard — persist rehydrates asynchronously; this ensures we don't show stale SSR state
    const [clientMounted, setClientMounted] = useState(false);
    useEffect(() => { setClientMounted(true); }, []);

    const saved = clientMounted && isCarSaved;
    const compared = clientMounted && isCarCompared;

    const toggleGarage = () => {
        if (saved) removeGarageCar(car.vin);
        else addGarageCar(car);
    };

    const toggleCompare = () => {
        if (compared) {
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
        <div className={cn('flex items-center gap-3', className)}>
            <button
                onClick={toggleGarage}
                className={cn(
                    'flex flex-1 items-center justify-center gap-2 px-4 py-3 border transition-colors duration-200 text-[10px] font-bold uppercase tracking-widest cursor-pointer',
                    saved
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-900 border-gray-200 hover:border-gray-900'
                )}
                title={saved ? 'Usuń z garażu' : 'Dodaj do garażu'}
            >
                <Warehouse className="w-4 h-4" />
                {saved ? 'W Garażu' : 'Do Garażu'}
            </button>
            <button
                onClick={toggleCompare}
                className={cn(
                    'flex flex-1 items-center justify-center gap-2 px-4 py-3 border transition-colors duration-200 text-[10px] font-bold uppercase tracking-widest cursor-pointer',
                    compared
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-900 border-gray-200 hover:border-gray-900'
                )}
                title={compared ? 'Usuń z porównania' : 'Porównaj'}
            >
                <Scale className="w-4 h-4" />
                {compared ? 'Porównujesz' : 'Porównaj'}
            </button>
        </div>
    );
}
