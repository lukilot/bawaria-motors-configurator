import { create } from 'zustand';

export type AdminView = 'stock' | 'dictionaries' | 'pricing' | 'bulletins' | 'settings' | 'syncLogs';

export interface HeaderAction {
    label: string;
    icon?: any; // e.g. 'Plus'
    onClick: () => void;
    primary?: boolean;
    disabled?: boolean;
}

interface AdminState {
    currentView: AdminView;
    isDirty: boolean;
    onSave: (() => void | Promise<void>) | null;
    headerAction: HeaderAction | null;
    setView: (view: AdminView) => void;
    setDirty: (isDirty: boolean) => void;
    setOnSave: (action: (() => void | Promise<void>) | null) => void;
    setHeaderAction: (action: HeaderAction | null) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
    currentView: 'stock',
    isDirty: false,
    onSave: null,
    headerAction: null,
    setView: (view) => set({ currentView: view }),
    setDirty: (isDirty) => set({ isDirty }),
    setOnSave: (action) => set({ onSave: action }),
    setHeaderAction: (action) => set({ headerAction: action }),
}));
