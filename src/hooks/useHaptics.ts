'use client';

import { useCallback } from 'react';

export function useHaptics() {
    const vibrate = useCallback((pattern: number | number[]) => {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            try {
                navigator.vibrate(pattern);
            } catch (e) {
                // Ignore errors
            }
        }
    }, []);

    return {
        light: () => vibrate(15),           // Very short tap (e.g., hovering or slight interactions)
        medium: () => vibrate(30),          // Distinct click (e.g., clicking standard buttons)
        heavy: () => vibrate(50),           // Solid confirmation
        success: () => vibrate([20, 60, 30]), // Double tap (e.g., successfully saving to garage)
        error: () => vibrate([40, 40, 40]),   // Stutter (e.g., error alert)
    };
}
