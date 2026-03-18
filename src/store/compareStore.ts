import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StockCar } from '@/types/stock';

interface CompareState {
    compareCars: StockCar[];
    isModalOpen: boolean;
    addCar: (car: StockCar) => void;
    removeCar: (groupId: string) => void;
    isCompared: (groupId: string) => boolean;
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
                if (!compareCars.find(c => c.product_group_id === car.product_group_id)) {
                    set({ compareCars: [...compareCars, car] });
                }
            },
            removeCar: (groupId) => {
                set({ compareCars: get().compareCars.filter(c => c.product_group_id !== groupId) });
            },
            isCompared: (groupId) => {
                return get().compareCars.some(c => c.product_group_id === groupId);
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
