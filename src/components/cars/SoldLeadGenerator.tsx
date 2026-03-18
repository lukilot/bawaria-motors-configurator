'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ProductGroup, StockCar } from '@/types/stock';
import { Phone, ArrowRight, CheckCircle, SearchX, Gauge, Fuel, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function CompactCarCard({ car, group }: { car: StockCar, group: ProductGroup }) {
    const imageUrl = (group.images && group.images.length > 0)
        ? group.images[0].url
        : 'https://images.unsplash.com/photo-1555353540-64fd1b71ead6?q=80&w=800&auto=format&fit=crop';
    
    // Fallback ID if car.product_group_id is somehow missing
    const groupId = car.product_group_id || group.id;
    const price = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: car.currency || 'PLN', maximumFractionDigits: 0 }).format(car.special_price || car.list_price);
    const shortId = groupId.slice(0, 8).toUpperCase();

    return (
        <Link 
            href={`/cars/${shortId}`} 
            className="group flex flex-row bg-white/[0.08] hover:bg-white/[0.18] backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden transition-all duration-500 transform hover:-translate-y-1 shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] hover:border-white/40 cursor-pointer"
        >
            <div className="relative w-32 shrink-0">
                <Image 
                    src={imageUrl} 
                    alt={car.model_name || 'BMW'} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-700" 
                />
            </div>
            <div className="p-4 flex flex-col justify-between flex-grow">
                <div>
                    <h4 className="text-white font-bold text-sm tracking-tight mb-1 truncate">{car.model_name || `BMW ${car.model_code}`}</h4>
                    <div className="flex items-center gap-3 text-[10px] text-gray-300 font-medium">
                        <span className="flex items-center gap-1"><Gauge className="w-3 h-3"/> {car.power} KM</span>
                        <span className="flex items-center gap-1"><Fuel className="w-3 h-3"/> {car.fuel_type}</span>
                    </div>
                </div>
                <div className="flex items-end justify-between mt-3">
                    <span className="text-white font-bold text-sm">{price}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 group-hover:text-blue-300 transition-colors flex items-center gap-1">
                        Zobacz <ArrowRight className="w-3 h-3" />
                    </span>
                </div>
            </div>
        </Link>
    );
}

export function SoldLeadGenerator({ 
    groupId, 
    group, 
    modelName, 
    similarGroups 
}: { 
    groupId: string, 
    group: ProductGroup, 
    modelName: string, 
    similarGroups: ProductGroup[] 
}) {
    const [phone, setPhone] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const coverImage = (group.images && group.images.length > 0) 
        ? group.images[0].url 
        : 'https://images.unsplash.com/photo-1555353540-64fd1b71ead6?q=80&w=3840&auto=format&fit=crop';
    const shortId = groupId.slice(0, 8).toUpperCase();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setLoading(false);
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-white overflow-y-auto lg:overflow-hidden">
            
            {/* LEFT SIDE: Lead Generation Form (Lighter Theme) */}
            <div className="w-full lg:w-[45%] xl:w-[40%] h-full bg-white flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 py-12 overflow-y-auto shrink-0 z-20 shadow-[20px_0_40px_rgba(0,0,0,0.1)]">
                
                <div className="w-full max-w-md mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 mb-8">
                        <SearchX className="w-4 h-4 text-red-500" />
                        <span className="text-[10px] font-mono font-bold tracking-widest text-red-600 uppercase">
                            OFERTA ARCHIWALNA: {shortId}
                        </span>
                    </div>

                    <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight mb-6 text-gray-900 leading-tight">
                        Niestety, ta oferta znalazła już właściciela.
                    </h1>
                    
                    <p className="text-base lg:text-lg text-gray-500 mb-10 leading-relaxed font-light">
                        Model <strong className="font-semibold text-gray-800">{modelName}</strong> opuścił już nasz salon. Codziennie wprowadzamy jednak nowe pojazdy. Zostaw numer telefonu, a znajdziemy dla Ciebie bliźniaczy egzemplarz prosto z placu.
                    </p>

                    <div>
                        {submitted ? (
                            <div className="flex flex-col items-center justify-center py-8 px-6 bg-green-50 border border-green-100 rounded-3xl animate-in fade-in zoom-in-95 duration-500">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Dziękujemy!</h3>
                                <p className="text-sm text-gray-600 text-center">
                                    Nasz doradca wkrótce się z Tobą skontaktuje i przedstawi nowe warianty dla modelu {modelName}.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div className="flex flex-col text-left gap-2">
                                    <label htmlFor="phone" className="text-xs uppercase tracking-widest font-bold text-gray-500 pl-1">Numer Telefonu</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input 
                                            id="phone"
                                            type="tel" 
                                            required
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+48 000 000 000"
                                            className="w-full h-16 bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all font-mono text-lg shadow-sm"
                                        />
                                    </div>
                                </div>
                                <Button 
                                    type="submit" 
                                    disabled={loading || phone.length < 9}
                                    className="h-16 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-3 text-sm"
                                >
                                    {loading ? 'Przetwarzanie...' : 'Znajdź mi podobne BMW'}
                                    {!loading && <ArrowRight className="w-5 h-5" />}
                                </Button>
                                <p className="text-center text-[10px] text-gray-400 mt-2 font-medium">Brak ukrytych opłat. Oddzwaniamy zwykle w ciągu 15 minut.</p>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: Visual Backdrop & Similar Offers */}
            <div className="relative flex-grow h-[50vh] lg:h-full bg-slate-950 flex flex-col justify-end p-6 lg:p-12 xl:p-16 overflow-hidden">
                {/* Background Hero Banner */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <Image 
                        src={coverImage} 
                        alt="Sold Car Cover" 
                        fill 
                        className="object-cover opacity-60 blur-[12px] scale-110 saturate-[1.2]" 
                        priority
                    />
                    {/* Cinematic overlay instead of flat black */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/80 via-slate-950/50 to-slate-900/20 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/60 to-transparent" />
                </div>

                {similarGroups.length > 0 && (
                    <div className="relative z-10 w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <div className="flex items-center gap-3 mb-6">
                            <h2 className="text-xl lg:text-3xl font-bold text-white tracking-tight">Dostępne alternatywy od ręki</h2>
                            <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-mono font-bold text-white border border-white/20">
                                {similarGroups.length}
                            </span>
                        </div>
                        
                        {/* Compact Cards Grid Overlaid at the bottom */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {similarGroups.map((simGroup) => (
                                <CompactCarCard 
                                    key={simGroup.id} 
                                    car={simGroup.available_units![0]} 
                                    group={simGroup}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {similarGroups.length === 0 && (
                    <div className="relative z-10 w-full h-full flex items-center justify-center pb-20">
                        <div className="flex flex-col items-center opacity-50">
                            <Info className="w-12 h-12 text-white mb-4 opacity-50" />
                            <p className="text-white font-medium text-lg tracking-wide uppercase">Brak podobnych modeli na placu</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
