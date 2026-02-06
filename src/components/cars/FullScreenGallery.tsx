'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FullScreenGalleryProps {
    images: { url: string; sort_order: number }[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
}

export function FullScreenGallery({ images, initialIndex, isOpen, onClose }: FullScreenGalleryProps) {
    const [index, setIndex] = useState(initialIndex);

    // Sync internal state when opening
    useEffect(() => {
        if (isOpen) setIndex(initialIndex);
    }, [isOpen, initialIndex]);

    const nextImage = useCallback(() => {
        setIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const prevImage = useCallback(() => {
        setIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, nextImage, prevImage]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
                    onClick={onClose} // Close on backdrop click
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-[110]"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    {/* Main Image Container */}
                    <div
                        className="relative max-w-[90vw] max-h-[90vh] bg-white p-12 shadow-2xl rounded-sm overflow-hidden"
                        onClick={(e) => e.stopPropagation()} // Prevent close on image click
                    >
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="relative w-full h-full flex items-center justify-center bg-gray-50"
                        >
                            <img
                                src={images[index].url}
                                alt={`Gallery image ${index + 1}`}
                                className="max-w-full max-h-[75vh] object-contain"
                            />
                        </motion.div>

                        {/* Navigation Buttons (Absolute to container or screen depending on preference, sticking to screen usually better for full feeling) */}
                    </div>

                    {/* Navigation Arrows (Fixed to screen for easier access) */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-all p-4 hover:bg-white/10 rounded-full"
                            >
                                <ChevronLeft className="w-10 h-10" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-all p-4 hover:bg-white/10 rounded-full"
                            >
                                <ChevronRight className="w-10 h-10" />
                            </button>
                        </>
                    )}

                    {/* Counter */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 font-mono text-sm tracking-widest">
                        {index + 1} / {images.length}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
