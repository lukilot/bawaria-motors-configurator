'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isVDP = pathname.startsWith('/cars/');

    return (
        <motion.div
            key={pathname}
            initial={{ opacity: 0, y: isVDP ? 20 : 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isVDP ? -20 : 0 }}
            transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                duration: 0.5,
            }}
            className="will-change-transform will-change-opacity"
        >
            {children}
        </motion.div>
    );
}
