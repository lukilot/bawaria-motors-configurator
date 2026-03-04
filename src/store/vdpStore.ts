import { create } from 'zustand';
import { StockCar } from '@/types/stock';

interface VdpState {
    currentCar: StockCar | null;
    siblings: StockCar[];
    additionalCost: number;
    setCurrentCar: (car: StockCar | null) => void;
    setSiblings: (siblings: StockCar[]) => void;
    setAdditionalCost: (cost: number) => void;
}

export const useVdpStore = create<VdpState>((set) => ({
    currentCar: null,
    siblings: [],
    additionalCost: 0,
    setCurrentCar: (car) => set({ currentCar: car }),
    setSiblings: (siblings) => set({ siblings }),
    setAdditionalCost: (cost) => set({ additionalCost: cost }),
}));
