'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
    className?: string;
    isDark?: boolean;
}

export function NeueKlasseGrille({ className, isDark = true }: Props) {
    const strokeColor = isDark ? "stroke-white" : "stroke-gray-300";
    const glowClass = isDark ? "drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" : "";

    return (
        <div className={cn("flex flex-col items-center justify-center w-full", className)}>
            <svg viewBox="0 0 500 200" className="w-full h-auto max-w-[400px]" fill="none">
                {/* 
                  Neue Klasse Grille:
                  Two tall, rounded rectangles in the center.
                */}
                
                {/* Left Kidney */}
                <motion.path 
                    d="M 215 50 
                       C 240 50, 245 55, 245 80
                       L 245 140
                       C 245 165, 230 170, 215 170
                       C 195 170, 185 165, 185 140
                       L 185 80
                       C 185 55, 195 50, 215 50 Z"
                    strokeWidth="4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                    className={cn(strokeColor, glowClass)}
                />

                {/* Right Kidney */}
                <motion.path 
                    d="M 285 50 
                       C 260 50, 255 55, 255 80
                       L 255 140
                       C 255 165, 270 170, 285 170
                       C 305 170, 315 165, 315 140
                       L 315 80
                       C 315 55, 305 50, 285 50 Z"
                    strokeWidth="4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.1 }}
                    className={cn(strokeColor, glowClass)}
                />

                {/* Left Headlights (Horizontal + Diagonal slashes) */}
                <motion.path
                    d="M 165 110 L 60 115"
                    strokeWidth="5" strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0, 1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    className={cn(strokeColor, glowClass)}
                />
                <motion.path
                    d="M 120 75 L 140 105"
                    strokeWidth="6" strokeLinecap="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                    className={cn(strokeColor, glowClass)}
                />
                <motion.path
                    d="M 80 80 L 100 110"
                    strokeWidth="6" strokeLinecap="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                    className={cn(strokeColor, glowClass)}
                />

                {/* Right Headlights */}
                <motion.path
                    d="M 335 110 L 440 115"
                    strokeWidth="5" strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0, 1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    className={cn(strokeColor, glowClass)}
                />
                <motion.path
                    d="M 380 75 L 360 105"
                    strokeWidth="6" strokeLinecap="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                    className={cn(strokeColor, glowClass)}
                />
                <motion.path
                    d="M 420 80 L 400 110"
                    strokeWidth="6" strokeLinecap="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                    className={cn(strokeColor, glowClass)}
                />

                {/* Minimalist BMW Logo outline above the grille */}
                <motion.circle 
                    cx="250" cy="25" r="10" 
                    strokeWidth="1.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={strokeColor}
                />
                <motion.path 
                    d="M 240 25 L 260 25 M 250 15 L 250 35" 
                    strokeWidth="1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className={strokeColor}
                />
            </svg>
        </div>
    );
}
