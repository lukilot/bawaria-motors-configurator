import { create } from 'zustand';
import { StockCar, ImportResult } from '@/types/stock';

interface StockState {
    // Upload State
    importResult: ImportResult | null;
    setImportResult: (result: ImportResult | null) => void;

    // Dashboard State
    cars: StockCar[];
    setCars: (cars: StockCar[]) => void;

    // UI State
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

export const useStockStore = create<StockState>((set) => ({
    importResult: null,
    setImportResult: (result) => set({ importResult: result }),

    cars: [],
    setCars: (cars) => set({ cars }),

    isLoading: false,
    setIsLoading: (loading) => set({ isLoading: loading }),
}));
