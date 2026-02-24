import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StockCar } from '@/types/stock';

interface CompareState {
    compareCars: StockCar[];
    isModalOpen: boolean;
    addCar: (car: StockCar) => void;
    removeCar: (vin: string) => void;
    isCompared: (vin: string) => boolean;
    clearCompare: () => void;
    openModal: () => void;
    closeModal: () => void;
}

export const useCompareStore = create<CompareState>()(
    persist(
        (set, get) => ({
            compareCars: [],
            isModalOpen: false,
            addCar: (car) => {
                const { compareCars } = get();
                if (compareCars.length >= 3) {
                    // Maximum 3 cars
                    return;
                }
                if (!compareCars.find(c => c.vin === car.vin)) {
                    set({ compareCars: [...compareCars, car] });
                }
            },
            removeCar: (vin) => {
                set({ compareCars: get().compareCars.filter(c => c.vin !== vin) });
            },
            isCompared: (vin) => {
                return get().compareCars.some(c => c.vin === vin);
            },
            clearCompare: () => set({ compareCars: [] }),
            openModal: () => set({ isModalOpen: true }),
            closeModal: () => set({ isModalOpen: false }),
        }),
        {
            name: 'bawaria-compare-storage', // name of the item in the storage (must be unique)
        }
    )
);
