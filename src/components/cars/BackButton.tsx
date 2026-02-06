'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
    label?: string;
    className?: string;
}

export function BackButton({ label = 'Back', className }: BackButtonProps) {
    const router = useRouter();

    return (
        <button
            onClick={() => {
                // Try to find the last SRP url
                const lastSrp = sessionStorage.getItem('bawaria_last_srp');
                if (lastSrp) {
                    router.push(lastSrp);
                } else {
                    // Fallback to default filtered list (reset)
                    router.push('/');
                }
            }}
            className={className}
        >
            <ArrowLeft className="w-4 h-4" />
            {label}
        </button>
    );
}
