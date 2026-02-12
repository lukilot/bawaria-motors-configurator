'use client';

import { X, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ContactOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ContactOverlay({ isOpen, onClose }: ContactOverlayProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300); // Wait for animation
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300",
                isOpen ? "bg-black/60 backdrop-blur-sm opacity-100" : "bg-black/0 backdrop-blur-none opacity-0 pointer-events-none"
            )}
            onClick={onClose}
        >
            <div
                className={cn(
                    "bg-white w-full max-w-md p-8 rounded-sm shadow-2xl transform transition-all duration-300 relative",
                    isOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-8 scale-95 opacity-0"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>

                <div className="text-center mb-8">
                    <h3 className="text-xl font-light text-gray-900 tracking-tight mb-2">Skontaktuj się.</h3>
                    <p className="text-sm text-gray-500 font-light">
                        Wybierz preferowaną formę kontaktu.
                    </p>
                </div>

                <div className="space-y-4">
                    <a
                        href="tel:+48508020612"
                        className="flex items-center gap-4 p-4 border border-gray-100 hover:border-black hover:bg-gray-50 transition-all group rounded-sm"
                    >
                        <div className="bg-gray-100 p-3 rounded-full group-hover:bg-white group-hover:shadow-md transition-all">
                            <Phone className="w-5 h-5 text-gray-900" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Zadzwoń teraz</p>
                            <p className="text-lg font-medium text-gray-900">+48 508 020 612</p>
                        </div>
                    </a>

                    <a
                        href="mailto:lotoszynski_l@bmw-bawariamotors.pl"
                        className="flex items-center gap-4 p-4 border border-gray-100 hover:border-black hover:bg-gray-50 transition-all group rounded-sm"
                    >
                        <div className="bg-gray-100 p-3 rounded-full group-hover:bg-white group-hover:shadow-md transition-all">
                            <Mail className="w-5 h-5 text-gray-900" />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-0.5">Napisz wiadomość</p>
                            <p className="text-sm font-medium text-gray-900 break-all">lotoszynski_l@bmw-bawariamotors.pl</p>
                        </div>
                    </a>
                </div>


            </div>
        </div>
    );
}
