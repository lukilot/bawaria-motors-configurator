'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface FullScreenGalleryProps {
    images: { url: string; sort_order: number }[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
}

export function FullScreenGallery({ images, initialIndex, isOpen, onClose }: FullScreenGalleryProps) {
    const [index, setIndex] = useState(initialIndex);
    const [mounted, setMounted] = useState(false);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => { setMounted(true); }, []);

    // Sync index when opening
    useEffect(() => {
        if (isOpen) setIndex(initialIndex);
    }, [isOpen, initialIndex]);

    // Lock body scroll — save & restore scroll position to avoid jump
    useEffect(() => {
        if (isOpen) {
            const y = window.scrollY;
            setScrollY(y);
            document.body.style.overflow = 'hidden';
            document.body.style.top = `-${y}px`;
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            if (scrollY) window.scrollTo(0, scrollY);
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
        };
    }, [isOpen]);

    const nextImage = useCallback(() => setIndex(p => (p + 1) % images.length), [images.length]);
    const prevImage = useCallback(() => setIndex(p => (p - 1 + images.length) % images.length), [images.length]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose, nextImage, prevImage]);

    // Render via portal into document.body to escape any transform stacking context
    // (framer-motion's motion.div in template.tsx creates a stacking context that
    //  breaks fixed positioning — portaling out fixes this entirely)
    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        // Inline styles guarantee correct viewport anchoring
                        // regardless of any transform in ancestor components
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                    }}
                    onClick={onClose}
                >
                    {/* Close */}
                    <button
                        onClick={e => { e.stopPropagation(); onClose(); }}
                        style={{ position: 'fixed', top: 24, right: 24, zIndex: 10000 }}
                        className="text-gray-400 hover:text-black hover:bg-gray-100 rounded-full p-2 transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    {/* Image */}
                    <div
                        style={{ width: '100%', height: '100%', padding: '5vh 8vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={index}
                                src={images[index]?.url}
                                alt={`Zdjęcie ${index + 1}`}
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.03 }}
                                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '80vh',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))',
                                }}
                            />
                        </AnimatePresence>
                    </div>

                    {/* Arrows */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={e => { e.stopPropagation(); prevImage(); }}
                                style={{ position: 'fixed', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 10000 }}
                                className="p-4 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all"
                            >
                                <ChevronLeft className="w-10 h-10" />
                            </button>
                            <button
                                onClick={e => { e.stopPropagation(); nextImage(); }}
                                style={{ position: 'fixed', right: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 10000 }}
                                className="p-4 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all"
                            >
                                <ChevronRight className="w-10 h-10" />
                            </button>
                        </>
                    )}

                    {/* Counter */}
                    <div
                        style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 10000 }}
                        className="text-gray-400 font-mono text-sm tracking-widest"
                    >
                        {index + 1} / {images.length}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
