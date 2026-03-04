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
            <div className="lg:hidden flex flex-col gap-2 px-4">
                <div
                    className={cn(
                        "relative aspect-[16/9] overflow-hidden cursor-zoom-in rounded-[2rem] border shadow-lg transition-all duration-700",
                        isDark ? "bg-[#0f0f0f] border-white/5 shadow-black/40" : "bg-gray-50 border-black/5 shadow-black/5"
                    )}
                    onClick={() => openLightbox(mobileIndex)}
                >
                    {hasImages ? (
                        <img
                            key={mobileIndex}
                            src={images[mobileIndex].url}
                            alt={`${modelName} – ${mobileIndex + 1}`}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="relative w-full h-full overflow-hidden">
                            <img
                                src="/images/car-cover.png"
                                alt="Zdjęcia wkrótce"
                                className="w-full h-full object-cover opacity-60"
                            />
                            <div className="absolute inset-x-0 bottom-0 flex items-end justify-center p-6 pb-12">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] bg-black/80 text-white px-5 py-2.5 rounded-full backdrop-blur-md border border-white/10 shadow-2xl">
                                    Zdjęcia wkrótce
                                </span>
                            </div>
                        </div>
                    )}

                    {hasImages && images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); setMobileIndex(p => (p - 1 + images.length) % images.length); }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white text-black hover:text-black backdrop-blur-md border border-white/20 transition-all z-10"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setMobileIndex(p => (p + 1) % images.length); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white text-black hover:text-black backdrop-blur-md border border-white/20 transition-all z-10"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                                <Camera className="w-3.5 h-3.5" />
                                <span className="font-bold tracking-widest">{mobileIndex + 1} / {images.length}</span>
                            </div>
                        </>
                    )}
                </div>

                {hasImages && images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {images.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => setMobileIndex(i)}
                                className={cn(
                                    "shrink-0 w-20 h-13 rounded-xl overflow-hidden border-2 transition-all",
                                    mobileIndex === i ? (isDark ? "border-white" : "border-black") : "border-transparent opacity-50 hover:opacity-100"
                                )}
                            >
                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ═══ DESKTOP: Two-row Bento (≥ lg) ═══ */}
            <div className="hidden lg:flex lg:flex-col gap-3">
                {/* ── Row 1: Hero panoramic image ── */}
                <div
                    className={cn(
                        "relative w-full overflow-hidden group cursor-zoom-in rounded-[2.5rem] border transition-all duration-700",
                        isDark ? "bg-[#0f0f0f] border-white/5 shadow-2xl shadow-black/50" : "bg-gray-50 border-black/[0.03] shadow-lg shadow-black/[0.02]"
                    )}
                    style={{ aspectRatio: '16/7' }}
                    onClick={() => openLightbox(0)}
                >
                    {hasImages ? (
                        <>
                            <img
                                src={images[0].url}
                                alt="Main view"
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.03]"
                            />
                            {/* Expand hint */}
                            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 duration-500 flex items-center gap-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] px-5 py-3 rounded-full border border-white/10 shadow-2xl">
                                <Images className="w-4 h-4" />
                                Powiększ galerię
                            </div>
                        </>
                    ) : (
                        <div className="relative w-full h-full overflow-hidden">
                            <img
                                src="/images/car-cover.png"
                                alt="Zdjęcia wkrótce"
                                className="w-full h-full object-cover opacity-60"
                            />
                            <div className="absolute inset-0 flex items-end justify-start p-8">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] bg-black/80 text-white px-5 py-2.5 rounded-full backdrop-blur-md border border-white/10 shadow-2xl">
                                    Zdjęcia wkrótce
                                </span>
                            </div>
                        </div>
                    )}
                    {electricAccent && <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#0653B6] to-[#2E95D3] animate-pulse" />}
                </div>

                {/* ── Row 2: 4 equal secondary tiles ── */}
                {hasImages && images.length > 1 && (
                    <div className="grid grid-cols-4 gap-3">
                        {/* Tiles 2, 3, 4 — plain previews */}
                        {images.slice(1, 4).map((img, i) => (
                            <div
                                key={i + 1}
                                className={cn(
                                    "relative aspect-[4/3] overflow-hidden group cursor-zoom-in rounded-[1.5rem] border transition-all duration-500",
                                    isDark ? "bg-[#1a1a1a] border-white/5" : "bg-gray-100 border-black/5"
                                )}
                                onClick={() => openLightbox(i + 1)}
                            >
                                <img
                                    src={img.url}
                                    alt=""
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </div>
                        ))}

                        {/* 4th tile: "+N" overlay or the 4th image */}
                        <div
                            className={cn(
                                "relative aspect-[4/3] overflow-hidden group cursor-pointer rounded-[1.5rem] border transition-all duration-500",
                                isDark ? "bg-[#1a1a1a] border-white/5" : "bg-gray-100 border-black/5"
                            )}
                            onClick={() => openLightbox(4)}
                        >
                            {images[4] ? (
                                <>
                                    <img
                                        src={images[4].url}
                                        alt=""
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.1]"
                                    />
                                    <div className="absolute inset-8 rounded-[1.5rem] bg-black/40 backdrop-blur-md group-hover:bg-black/50 transition-all flex flex-col items-center justify-center text-white border border-white/10 shadow-2xl">
                                        <Camera className="w-5 h-5 mb-2 opacity-80 group-hover:scale-110 transition-transform" />
                                        <span className="text-3xl font-black leading-none tracking-tight">{images.length}</span>
                                        <span className="text-[10px] uppercase font-black tracking-[0.2em] mt-1.5 opacity-70">zdjęć</span>
                                    </div>
                                </>
                            ) : images[3] ? (
                                <>
                                    <img src={images[3].url} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-8 rounded-[1.5rem] bg-black/40 backdrop-blur-md group-hover:bg-black/50 transition-all flex flex-col items-center justify-center text-white border border-white/10 shadow-2xl">
                                        <Camera className="w-5 h-5 mb-2 opacity-80" />
                                        <span className="text-3xl font-black leading-none tracking-tight">{images.length}</span>
                                        <span className="text-[10px] uppercase font-black tracking-[0.2em] mt-1.5 opacity-70">zdjęć</span>
                                    </div>
                                </>
                            ) : (
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
                images={hasImages ? images : [{ url: '/images/car-cover.png', sort_order: 0 }]}
                onClose={() => setIsFullScreen(false)}
            />
        </>
    );
}
