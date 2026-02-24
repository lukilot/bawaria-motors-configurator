import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StockCar } from '@/types/stock';

interface GarageState {
    savedCars: StockCar[];
    isOpen: boolean;
    addCar: (car: StockCar) => void;
    removeCar: (vin: string) => void;
    isSaved: (vin: string) => boolean;
    clearGarage: () => void;
    openGarage: () => void;
    closeGarage: () => void;
}

export const useGarageStore = create<GarageState>()(
    persist(
        (set, get) => ({
            savedCars: [],
            isOpen: false,
            addCar: (car) => {
                const { savedCars } = get();
                if (!savedCars.find(c => c.vin === car.vin)) {
                    set({ savedCars: [...savedCars, car] });
                }
            },
            removeCar: (vin) => {
                set({ savedCars: get().savedCars.filter(c => c.vin !== vin) });
            },
            isSaved: (vin) => {
                return get().savedCars.some(c => c.vin === vin);
            },
            clearGarage: () => set({ savedCars: [] }),
            openGarage: () => set({ isOpen: true }),
            closeGarage: () => set({ isOpen: false }),
        }),
        {
            name: 'bawaria-garage-storage', // name of the item in the storage (must be unique)
        }
    )
);
