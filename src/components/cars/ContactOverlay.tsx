'use client';

import { X, Phone, Mail, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ContactOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    offerNumber?: string;
}

export function ContactOverlay({ isOpen, onClose, offerNumber }: ContactOverlayProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
            setCopied(false);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleCopy = () => {
        if (offerNumber) {
            navigator.clipboard.writeText(offerNumber);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

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
                    "bg-white w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-2xl transform transition-all duration-300 relative",
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
                    <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Skontaktuj się</h3>
                    <p className="text-sm text-gray-500">
                        Zadzwoń lub napisz do nas. Powołaj się na numer oferty, abyśmy mogli szybciej pomóc.
                    </p>
                </div>

                {offerNumber && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between group">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Twój numer oferty</span>
                            <span className="font-mono text-xl font-bold tracking-wider text-gray-900">{offerNumber}</span>
                        </div>
                        <button 
                            onClick={handleCopy}
                            className="p-2.5 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
                            title="Kopiuj numer"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                        </button>
                    </div>
                )}

                <div className="space-y-3">
                    <a
                        href="tel:+48508020612"
                        className="flex items-center gap-4 p-4 border border-gray-100 hover:border-black hover:bg-gray-50 transition-all group rounded-xl"
                    >
                        <div className="bg-gray-100 p-3 rounded-xl group-hover:bg-white group-hover:shadow-md transition-all">
                            <Phone className="w-5 h-5 text-gray-900" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-0.5">Telefon</p>
                            <p className="text-lg font-bold text-gray-900">+48 508 020 612</p>
                        </div>
                    </a>

                    <a
                        href="mailto:lotoszynski_l@bmw-bawariamotors.pl"
                        className="flex items-center gap-4 p-4 border border-gray-100 hover:border-black hover:bg-gray-50 transition-all group rounded-xl"
                    >
                        <div className="bg-gray-100 p-3 rounded-xl group-hover:bg-white group-hover:shadow-md transition-all">
                            <Mail className="w-5 h-5 text-gray-900" />
                        </div>
                        <div className="text-left min-w-0 flex-1">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-0.5">E-mail</p>
                            <p className="text-sm font-bold text-gray-900 truncate">lotoszynski_l@bmw-bawariamotors.pl</p>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
}
