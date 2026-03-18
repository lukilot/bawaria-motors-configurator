import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StockCar } from '@/types/stock';

interface GarageState {
    savedCars: StockCar[];
    isOpen: boolean;
    addCar: (car: StockCar) => void;
    removeCar: (groupId: string) => void;
    isSaved: (groupId: string) => boolean;
    clearGarage: () => void;
    openGarage: () => void;
    closeGarage: () => void;
    toggleGarage: () => void;
}

export const useGarageStore = create<GarageState>()(
    persist(
        (set, get) => ({
            savedCars: [],
            isOpen: false,
            addCar: (car) => {
                const { savedCars } = get();
                if (!savedCars.find(c => c.product_group_id === car.product_group_id)) {
                    set({ savedCars: [...savedCars, car] });
                }
            },
            removeCar: (groupId) => {
                set({ savedCars: get().savedCars.filter(c => c.product_group_id !== groupId) });
            },
            isSaved: (groupId) => {
                return get().savedCars.some(c => c.product_group_id === groupId);
            },
            clearGarage: () => set({ savedCars: [] }),
            openGarage: () => set({ isOpen: true }),
            closeGarage: () => set({ isOpen: false }),
            toggleGarage: () => set({ isOpen: !get().isOpen }),
        }),
        {
            name: 'bawaria-garage-storage', // name of the item in the storage (must be unique)
        }
    )
);
