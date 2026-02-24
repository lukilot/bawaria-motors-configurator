'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Camera, ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { FullScreenGallery } from './FullScreenGallery';

interface CarGalleryProps {
    modelName: string;
    images?: { url: string; sort_order: number }[];
    isDark?: boolean;
    isElectric?: boolean;
}

export function CarGallery({ modelName, images = [], isDark = false, isElectric = false }: CarGalleryProps) {
    const [mobileIndex, setMobileIndex] = useState(0);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const hasImages = images.length > 0;
    const electricAccent = isElectric && !isDark;

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setIsFullScreen(true);
    };

    return (
        <>
            {electricAccent && (
                <div className="absolute inset-0 bg-blue-400/5 blur-3xl -z-10 pointer-events-none" />
            )}

            {/* ═══ MOBILE: Full-width slider (< lg) ═══ */}
            <div className="lg:hidden flex flex-col gap-2">
                <div
                    className={cn(
                        "relative aspect-[16/9] overflow-hidden cursor-zoom-in",
                        isDark ? "bg-[#0f0f0f]" : "bg-gray-50"
                    )}
                    onClick={() => hasImages && openLightbox(mobileIndex)}
                >
                    {hasImages ? (
                        <img
                            key={mobileIndex}
                            src={images[mobileIndex].url}
                            alt={`${modelName} – ${mobileIndex + 1}`}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        /* Pending — show cover image */
                        <div className="relative w-full h-full overflow-hidden">
                            <img
                                src="/images/car-cover.png"
                                alt="Zdjęcia wkrótce"
                                className="w-full h-full object-cover opacity-60"
                            />
                            <div className="absolute inset-0 flex items-end justify-start p-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-black/60 text-white px-2.5 py-1 rounded-full">
                                    Zdjęcia wkrótce
                                </span>
                            </div>
                        </div>
                    )}

                    {hasImages && images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); setMobileIndex(p => (p - 1 + images.length) % images.length); }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-black hover:text-white transition-colors z-10"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setMobileIndex(p => (p + 1) % images.length); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-black hover:text-white transition-colors z-10"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1.5">
                                <Camera className="w-3 h-3" />
                                {mobileIndex + 1} / {images.length}
                            </div>
                        </>
                    )}

                    {electricAccent && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-[#0653B6] to-[#2E95D3]" />}
                </div>

                {hasImages && images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {images.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => setMobileIndex(i)}
                                className={cn(
                                    "shrink-0 w-16 h-11 rounded overflow-hidden border-2 transition-all",
                                    mobileIndex === i ? "border-black" : "border-transparent opacity-50 hover:opacity-80"
                                )}
                            >
                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ═══ DESKTOP: Two-row Bento (≥ lg) ═══
                Row 1: one wide panoramic image (full width, 16:7 ratio)
                Row 2: 3 thumbnail tiles + 1 "show all" tile (4 equal cols)
            */}
            <div className="hidden lg:flex lg:flex-col gap-2">

                {/* ── Row 1: Hero panoramic image ── */}
                <div
                    className={cn(
                        "relative w-full overflow-hidden group cursor-zoom-in",
                        isDark ? "bg-[#0f0f0f]" : "bg-gray-50"
                    )}
                    style={{ aspectRatio: '16/7' }}
                    onClick={() => hasImages && openLightbox(0)}
                >
                    {hasImages ? (
                        <>
                            <img
                                src={images[0].url}
                                alt="Main view"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                            {/* Expand hint */}
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-white/90 text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow">
                                <Images className="w-3 h-3" />
                                Powiększ
                            </div>
                        </>
                    ) : (
                        /* Pending — show cover image */
                        <div className="relative w-full h-full overflow-hidden">
                            <img
                                src="/images/car-cover.png"
                                alt="Zdjęcia wkrótce"
                                className="w-full h-full object-cover opacity-60"
                            />
                            <div className="absolute inset-0 flex items-end justify-start p-6">
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-black/60 text-white px-3 py-1.5 rounded-full">
                                    Zdjęcia wkrótce
                                </span>
                            </div>
                        </div>
                    )}
                    {electricAccent && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-[#0653B6] to-[#2E95D3]" />}
                </div>

                {/* ── Row 2: 4 equal secondary tiles ── */}
                {hasImages && images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                        {/* Tiles 2, 3, 4 — plain previews */}
                        {images.slice(1, 4).map((img, i) => (
                            <div
                                key={i + 1}
                                className={cn(
                                    "relative aspect-[4/3] overflow-hidden group cursor-zoom-in",
                                    isDark ? "bg-[#1a1a1a]" : "bg-gray-100"
                                )}
                                onClick={() => openLightbox(i + 1)}
                            >
                                <img
                                    src={img.url}
                                    alt=""
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </div>
                        ))}

                        {/* 4th tile: "+N" overlay or the 4th image */}
                        <div
                            className={cn(
                                "relative aspect-[4/3] overflow-hidden group cursor-pointer",
                                isDark ? "bg-[#1a1a1a]" : "bg-gray-100"
                            )}
                            onClick={() => openLightbox(images.length > 4 ? 4 : 4)}
                        >
                            {images[4] ? (
                                <>
                                    <img
                                        src={images[4].url}
                                        alt=""
                                        className="w-full h-full object-cover scale-[1.05] transition-transform duration-500 group-hover:scale-[1.1]"
                                    />
                                    {/* Always show gallery count overlay */}
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex flex-col items-center justify-center text-white">
                                        <Camera className="w-5 h-5 mb-1.5 opacity-80" />
                                        <span className="text-2xl font-bold leading-none">{images.length}</span>
                                        <span className="text-[10px] uppercase tracking-widest mt-1 opacity-70">zdjęć</span>
                                    </div>
                                </>
                            ) : images[3] ? (
                                /* If there's no 5th image but there is a 4th, show 4th with count */
                                <>
                                    <img src={images[3].url} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex flex-col items-center justify-center text-white">
                                        <Camera className="w-5 h-5 mb-1.5 opacity-80" />
                                        <span className="text-2xl font-bold leading-none">{images.length}</span>
                                        <span className="text-[10px] uppercase tracking-widest mt-1 opacity-70">zdjęć</span>
                                    </div>
                                </>
                            ) : (
                                /* Fewer than 4 images — empty slot */
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <Camera className="w-6 h-6 opacity-30" />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Lightbox */}
            <FullScreenGallery
                isOpen={isFullScreen}
                initialIndex={lightboxIndex}
                images={images}
                onClose={() => setIsFullScreen(false)}
            />
        </>
    );
}
