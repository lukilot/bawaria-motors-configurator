import { create } from 'zustand';

export type AdminView = 'stock' | 'dictionaries' | 'pricing' | 'bulletins' | 'settings';

interface AdminState {
    currentView: AdminView;
    isDirty: boolean;
    onSave: (() => void | Promise<void>) | null;
    setView: (view: AdminView) => void;
    setDirty: (isDirty: boolean) => void;
    setOnSave: (action: (() => void | Promise<void>) | null) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
    currentView: 'stock',
    isDirty: false,
    onSave: null,
    setView: (view) => set({ currentView: view }),
    setDirty: (isDirty) => set({ isDirty }),
    setOnSave: (action) => set({ onSave: action }),
}));
