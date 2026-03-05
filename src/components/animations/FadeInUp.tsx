'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FadeInUpProps {
    children: ReactNode;
    delay?: number;
    className?: string;
    yOffset?: number;
}

export function FadeInUp({ children, delay = 0, className = "", yOffset = 40 }: FadeInUpProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: yOffset }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
                duration: 0.8,
                delay: delay,
                ease: [0.21, 0.47, 0.32, 0.98] // Out Cubic
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
