'use client';

import { useEffect } from 'react';
import { useVdpStore } from '@/store/vdpStore';
import { StockCar } from '@/types/stock';

interface VdpStoreInitProps {
    car: StockCar;
    siblings: StockCar[];
}

export function VdpStoreInit({ car, siblings }: VdpStoreInitProps) {
    const { setCurrentCar, setSiblings } = useVdpStore();

    useEffect(() => {
        // Hydrate the store with current car and variants
        setCurrentCar(car);
        setSiblings(siblings);

        // Cleanup on unmount
        return () => {
            setCurrentCar(null);
            setSiblings([]);
        };
    }, [car, siblings, setCurrentCar, setSiblings]);

    return null;
}
