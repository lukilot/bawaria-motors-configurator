import { create } from 'zustand';
import { StockCar } from '@/types/stock';

interface VdpState {
    currentCar: StockCar | null;
    siblings: StockCar[];
    setCurrentCar: (car: StockCar | null) => void;
    setSiblings: (siblings: StockCar[]) => void;
}

export const useVdpStore = create<VdpState>((set) => ({
    currentCar: null,
    siblings: [],
    setCurrentCar: (car) => set({ currentCar: car }),
    setSiblings: (siblings) => set({ siblings }),
}));
