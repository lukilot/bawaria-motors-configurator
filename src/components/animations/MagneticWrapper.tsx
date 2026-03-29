'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MagneticWrapperProps {
    children: ReactNode;
    strength?: number;
    className?: string;
    disabled?: boolean;
}

export function MagneticWrapper({ children, strength = 0.2, className, disabled = false }: MagneticWrapperProps) {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled || !ref.current) return;
        const { clientX, clientY } = e;
        const { height, width, left, top } = ref.current.getBoundingClientRect();
        
        // Calculate distance from center of the element
        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);
        
        x.set(middleX * strength);
        y.set(middleY * strength);
    };

    const reset = () => {
        x.set(0);
        y.set(0);
    };

    if (disabled) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            style={{ x: springX, y: springY }}
            className={cn("inline-flex w-fit h-fit", className)}
        >
            {children}
        </motion.div>
    );
}
