'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Camera, Maximize2 } from 'lucide-react';
import { FullScreenGallery } from './FullScreenGallery';

interface CarGalleryProps {
    modelName: string;
    images?: { url: string; sort_order: number }[];
    isDark?: boolean;
    isElectric?: boolean;
}

export function CarGallery({ modelName, images = [], isDark = false, isElectric = false }: CarGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const hasImages = images.length > 0;
    const currentImage = hasImages ? images[currentIndex] : null;

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!hasImages) return;
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!hasImages) return;
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <>
            {/* Electric Gradient Background Glow */}
            {isElectric && !isDark && (
                <div className="absolute inset-0 bg-blue-400/5 blur-3xl -z-10 pointer-events-none" />
            )}

            <div className="flex flex-col gap-4 relative">

                {/* Main Image */}
                <div
                    className={cn(
                        "relative aspect-[4/3] overflow-hidden group rounded-sm cursor-zoom-in",
                        isDark ? "bg-[#0f0f0f]" : "bg-white",
                        isElectric && !isDark && "ring-1 ring-blue-200/50 shadow-[0_0_30px_-5px_rgba(6,83,182,0.1)]"
                    )}
                    onClick={() => hasImages && setIsFullScreen(true)}
                >
                    {isElectric && !isDark && (
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#0653B6] to-[#2E95D3] z-20" />
                    )}

                    {hasImages ? (
                        <img
                            src={currentImage!.url}
                            alt={`${modelName} - View ${currentIndex + 1}`}
                            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <>
                            {/* Car Under Cover */}
                            <div className="w-full h-full bg-gray-200">
                                <img
                                    src="/images/car-cover.png"
                                    alt="Vehicle in Preparation"
                                    className="w-full h-full object-cover opacity-80 mix-blend-multiply grayscale-[0.2]"
                                />
                            </div>
                            {/* Badge Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                                <span className="bg-white/90 backdrop-blur-md px-6 py-3 text-sm font-bold uppercase tracking-widest text-gray-900 border border-gray-200 shadow-sm">
                                    Ogłoszenie w trakcie przygotowania
                                </span>
                            </div>
                        </>
                    )}

                    {/* Navigation Overlays (Only if multiple images) */}
                    {hasImages && images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black hover:text-white z-10"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black hover:text-white z-10"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>

                            <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-2 mb-1">
                                <Camera className="w-3 h-3" />
                                {currentIndex + 1} / {images.length}
                            </div>
                        </>
                    )}

                    {/* Hover Hint */}
                    {hasImages && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur px-3 py-2 rounded-full shadow-lg flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 duration-300">
                                <Maximize2 className="w-4 h-4 text-black" />
                                <span className="text-xs font-bold uppercase tracking-wider text-black">Powiększ</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Thumbnails */}
                {hasImages && images.length > 1 && (
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={cn(
                                    "relative flex-shrink-0 w-24 h-16 rounded-sm overflow-hidden border-2 transition-all",
                                    isDark ? "bg-[#1a1a1a]" : "bg-gray-100",
                                    currentIndex === idx
                                        ? (isElectric && !isDark ? "border-[#0653B6] opacity-100" : "border-blue-600 opacity-100")
                                        : (isDark ? "border-transparent opacity-60 hover:opacity-100 invert-1" : "border-transparent opacity-60 hover:opacity-100")
                                )}
                            >
                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Full Screen Modal */}
            <FullScreenGallery
                isOpen={isFullScreen}
                initialIndex={currentIndex}
                images={images}
                onClose={() => setIsFullScreen(false)}
            />
        </>
    );
}
