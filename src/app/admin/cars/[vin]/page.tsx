'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { StockCar } from '@/types/stock';
import { compressImage } from '@/lib/image-utils';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Upload, Trash2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDropzone } from 'react-dropzone';
import { useParams, useRouter } from 'next/navigation';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Helper component for Sortable Item
function SortableImage({ img, index, onDelete }: { img: any, index: number, onDelete: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: img.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative aspect-[4/3] bg-gray-100 rounded-sm overflow-hidden group border border-transparent hover:border-blue-500 transition-colors"
        >
            <img
                src={img.url}
                alt="Car"
                className="w-full h-full object-cover cursor-grab active:cursor-grabbing"
                {...attributes}
                {...listeners}
            />
            <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-sm">
                #{index + 1}
            </div>
            <button
                type="button"
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(img.id);
                }}
            >
                <Trash2 className="w-3 h-3" />
            </button>
        </div>
    );
}

export default function AdminCarEditor() {
    const params = useParams();
    const router = useRouter();
    const vin = params?.vin as string;

    // State
    const [car, setCar] = useState<StockCar | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form State
    const [specialPrice, setSpecialPrice] = useState<string>('');
    const [listPrice, setListPrice] = useState<string>('');
    const [visibility, setVisibility] = useState<'PUBLIC' | 'INTERNAL' | 'HIDDEN'>('INTERNAL');
    const [individualColor, setIndividualColor] = useState<string>('');
    const [fuelType, setFuelType] = useState<string>('');
    const [power, setPower] = useState<string>('');
    const [drivetrain, setDrivetrain] = useState<string>('');
    const [colors, setColors] = useState<{ code: string, name: string }[]>([]);
    const [colorSearch, setColorSearch] = useState('');
    const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);

    // DND Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Fetch Car
    useEffect(() => {
        if (!vin) return;
        const fetchCar = async () => {
            const { data, error } = await supabase
                .from('stock_units')
                .select('*')
                .eq('vin', decodeURIComponent(vin))
                .single();

            if (data) {
                setCar(data as any);
                setSpecialPrice(data.special_price ? String(data.special_price) : '');
                setListPrice(String(data.list_price));
                setVisibility(data.visibility);
                setIndividualColor(data.individual_color || '');
                setFuelType(data.fuel_type || '');
                setPower(data.power || '');
                setDrivetrain(data.drivetrain || '');
            }
            setLoading(false);
        };
        fetchCar();
    }, [vin]);

    // Fetch Colors Dictionary
    useEffect(() => {
        const fetchColors = async () => {
            const { data } = await supabase
                .from('dictionaries')
                .select('code, data')
                .eq('type', 'color');
            if (data) {
                setColors(data.map(c => ({
                    code: c.code,
                    name: c.data.name || ''
                })));
            }
        };
        fetchColors();
    }, []);

    // Sync color search input when a color is selected or loaded
    useEffect(() => {
        if (individualColor && colors.length > 0 && !isColorDropdownOpen) {
            const match = colors.find(c => c.code === individualColor);
            if (match) {
                setColorSearch(`${match.code} - ${match.name}`);
            } else {
                setColorSearch(individualColor);
            }
        } else if (!individualColor && !isColorDropdownOpen) {
            setColorSearch('');
        }
    }, [individualColor, colors, isColorDropdownOpen]);

    // Save Handler for Prices/Visibility
    const handleSave = async () => {
        setSaving(true);
        setMsg(null);

        try {
            const updates = {
                special_price: specialPrice ? parseFloat(specialPrice) : null,
                list_price: parseFloat(listPrice),
                visibility: visibility,
                individual_color: individualColor || null,
                fuel_type: fuelType,
                power: power,
                drivetrain: drivetrain,
            };

            const { error } = await supabase
                .from('stock_units')
                .update(updates)
                .eq('vin', decodeURIComponent(vin));

            if (error) throw error;

            setMsg({ type: 'success', text: 'Changes saved successfully.' });
            router.refresh();
        } catch (e: any) {
            setMsg({ type: 'error', text: e.message });
        } finally {
            setSaving(false);
        }
    };

    // --- Image Manager Handlers ---
    const [uploading, setUploading] = useState(false);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id || !car) return;

        const oldIndex = car.images?.findIndex((img) => img.id === active.id) ?? -1;
        const newIndex = car.images?.findIndex((img) => img.id === over.id) ?? -1;

        if (oldIndex !== -1 && newIndex !== -1) {
            const newImages = arrayMove(car.images!, oldIndex, newIndex).map((img, i) => ({
                ...img,
                sort_order: i
            }));

            // Sync with DB
            const { error } = await supabase
                .from('stock_units')
                .update({ images: newImages })
                .eq('vin', car.vin);

            if (!error) {
                setCar({ ...car, images: newImages });
            }
        }
    };

    const handleDeleteImage = async (id: string) => {
        if (!car || !car.images) return;
        if (!confirm('Are you sure you want to delete this image?')) return;

        const newImages = car.images.filter(img => img.id !== id);

        const { error } = await supabase
            .from('stock_units')
            .update({ images: newImages })
            .eq('vin', car.vin);

        if (!error) {
            setCar({ ...car, images: newImages });
            setMsg({ type: 'success', text: 'Image deleted.' });
        } else {
            setMsg({ type: 'error', text: 'Failed to delete image.' });
        }
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!car) return;
        setUploading(true);

        try {
            const newImages = [...(car.images || [])];

            for (const file of acceptedFiles) {
                // Client-side compression
                let fileToUpload: File | Blob = file;
                if (file.type.startsWith('image/')) {
                    try {
                        fileToUpload = await compressImage(file);
                    } catch (err) {
                        console.warn('Compression failed, using original', err);
                    }
                }

                const formData = new FormData();
                formData.append('file', fileToUpload, file.name.replace(/\.[^/.]+$/, "") + ".webp");
                formData.append('vin', car.vin);

                const response = await fetch('/api/admin/upload-images', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    let errMsg = 'Upload failed';
                    try {
                        const errorData = await response.json();
                        errMsg = errorData.error || errMsg;
                    } catch {
                        errMsg = `Server Error [${response.status}]: ${await response.text()}`;
                    }
                    throw new Error(errMsg);
                }

                const responseData = await response.json();
                const url = responseData.url;

                newImages.push({
                    url: url,
                    id: crypto.randomUUID(),
                    sort_order: newImages.length
                });
            }

            const { error: dbError } = await supabase
                .from('stock_units')
                .update({ images: newImages })
                .eq('vin', car.vin);

            if (dbError) throw dbError;

            setCar({ ...car, images: newImages });
            setMsg({ type: 'success', text: `Uploaded ${acceptedFiles.length} images.` });

        } catch (e: any) {
            console.error(e);
            setMsg({ type: 'error', text: 'Upload failed: ' + e.message });
        } finally {
            setUploading(false);
        }
    }, [car]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    if (loading) return <div className="p-12 text-center text-gray-500 font-light">Loading vehicle data...</div>;
    if (!car) return <div className="p-12 text-center text-red-500">Vehicle not found.</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            <header className="bg-white border-b border-gray-100 py-6 px-8 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-light text-gray-900 tracking-tight">Edit Vehicle</h1>
                        <p className="text-xs text-gray-600 font-mono">{car.vin}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-black text-white hover:bg-gray-800 transition-all rounded-sm font-medium text-sm tracking-wide disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Settings
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Image Manager */}
                    <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Gallery</h3>
                                <p className="text-[10px] text-gray-500 uppercase mt-1">Drag photos to reorder. The first photo is the main one.</p>
                            </div>
                            {car.images && car.images.length > 0 && (
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-sm">
                                    {car.images.length} Photos
                                </span>
                            )}
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={car.images?.map(img => img.id) || []}
                                strategy={rectSortingStrategy}
                            >
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                                    {car.images?.map((img: any, i: number) => (
                                        <SortableImage
                                            key={img.id}
                                            img={img}
                                            index={i}
                                            onDelete={handleDeleteImage}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        {/* Dropzone */}
                        <div
                            {...getRootProps()}
                            className={cn(
                                "border-2 border-dashed border-gray-200 rounded-sm p-12 text-center cursor-pointer hover:border-black transition-colors bg-gray-50/50",
                                isDragActive && "border-black bg-gray-50",
                                uploading && "opacity-50 pointer-events-none"
                            )}
                        >
                            <input {...getInputProps()} />
                            {uploading ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 className="w-8 h-8 text-black animate-spin mb-2" />
                                    <p className="text-sm font-medium">Uploading images...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <Upload className="w-8 h-8 text-gray-500 mb-2" />
                                    <p className="text-sm text-gray-500 font-light">Drop photos here or click to upload</p>
                                    <p className="text-[10px] text-gray-500 uppercase mt-2">Auto-optimized to FullHD WebP</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Technical Details */}
                    <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">Vehicle Data</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                            <div>
                                <label className="block text-gray-700 text-[10px] uppercase font-bold mb-1">Model</label>
                                <p className="font-medium">{car.model_name || car.model_code}</p>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-[10px] uppercase font-bold mb-1">Status</label>
                                <p className="font-medium text-blue-600">{car.status_code} - {car.order_status}</p>
                            </div>
                            <div>
                                <label className="block text-gray-600 text-[10px] uppercase font-bold mb-1">Color</label>
                                <p className="font-medium">{car.color_code}</p>
                            </div>
                            <div>
                                <label className="block text-gray-600 text-[10px] uppercase font-bold mb-1">Upholstery</label>
                                <p className="font-medium">{car.upholstery_code}</p>
                            </div>
                            <div>
                                <label className="block text-gray-600 text-[10px] uppercase font-bold mb-1">Production</label>
                                <p className="font-medium">{car.production_date ? new Date(car.production_date).toLocaleDateString() : '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Controls */}
                <div className="space-y-6">
                    {/* Status Message */}
                    {msg && (
                        <div className={cn(
                            "p-4 rounded-sm border text-sm flex items-start gap-2",
                            msg.type === 'success' ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                        )}>
                            {msg.type === 'success' && <CheckCircle className="w-4 h-4 mt-0.5" />}
                            {msg.text}
                        </div>
                    )}

                    <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-6">Settings</h3>

                        {/* Visibility */}
                        <div className="mb-6">
                            <label className="block text-xs font-semibold uppercase text-gray-700 mb-2">Visibility</label>
                            <select
                                value={visibility}
                                onChange={(e) => setVisibility(e.target.value as any)}
                                className="w-full p-2 border border-gray-300 rounded-sm text-sm text-gray-900 focus:border-black outline-none"
                            >
                                <option value="INTERNAL">Internal Only (Hidden)</option>
                                <option value="PUBLIC">Public (Visible)</option>
                                <option value="HIDDEN">Archived</option>
                            </select>
                        </div>

                        {/* Pricing */}
                        <div className="mb-4">
                            <label className="block text-xs font-semibold uppercase text-gray-700 mb-2">List Price (PLN)</label>
                            <input
                                type="number"
                                value={listPrice}
                                onChange={(e) => setListPrice(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-sm text-sm text-gray-900"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-semibold uppercase text-gray-700 mb-2">Special Price (PLN)</label>
                            <input
                                type="number"
                                value={specialPrice}
                                onChange={(e) => setSpecialPrice(e.target.value)}
                                placeholder="Optional"
                                className="w-full p-2 border border-2 border-gray-300 rounded-sm text-sm text-gray-900 focus:border-blue-500 outline-none font-bold placeholder:text-gray-400"
                            />
                            <p className="text-[10px] text-gray-600 mt-1">Leave empty to use List Price.</p>
                        </div>

                        {car.color_code === '490' && (
                            <div className="mb-4 relative">
                                <label className="block text-xs font-semibold uppercase text-blue-700 mb-2 flex items-center gap-2">
                                    <span>BMW Individual Paint</span>
                                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm text-[8px]">SPECIAL</span>
                                </label>
                                <input
                                    type="text"
                                    value={colorSearch}
                                    onChange={(e) => {
                                        setColorSearch(e.target.value);
                                        setIsColorDropdownOpen(true);
                                        setIndividualColor(''); // clear exact selection while typing
                                    }}
                                    onFocus={() => setIsColorDropdownOpen(true)}
                                    // small delay to allow click on option
                                    onBlur={() => setTimeout(() => setIsColorDropdownOpen(false), 200)}
                                    placeholder="Wyszukaj kod lub nazwę..."
                                    className="w-full p-2 border border-blue-200 rounded-sm text-sm text-gray-900 focus:border-blue-500 outline-none placeholder:text-gray-400 bg-blue-50/30"
                                />
                                {isColorDropdownOpen && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-sm shadow-lg max-h-60 overflow-y-auto">
                                        {colors
                                            .filter(c =>
                                                c.code.toLowerCase().includes(colorSearch.toLowerCase()) ||
                                                c.name.toLowerCase().includes(colorSearch.toLowerCase())
                                            )
                                            .map(c => (
                                                <button
                                                    key={c.code}
                                                    type="button"
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex flex-col items-start gap-0.5"
                                                    onMouseDown={(e) => {
                                                        // use onMouseDown instead of onClick to fire before input onBlur
                                                        e.preventDefault();
                                                        setIndividualColor(c.code);
                                                        setColorSearch(`${c.code} - ${c.name}`);
                                                        setIsColorDropdownOpen(false);
                                                    }}
                                                >
                                                    <span className="font-bold">{c.code}</span>
                                                    <span className="text-xs text-gray-500">{c.name}</span>
                                                </button>
                                            ))}
                                        {colors.filter(c =>
                                            c.code.toLowerCase().includes(colorSearch.toLowerCase()) ||
                                            c.name.toLowerCase().includes(colorSearch.toLowerCase())
                                        ).length === 0 && (
                                                <div className="px-3 py-2 text-xs text-gray-500 italic">Brak wyników</div>
                                            )}
                                    </div>
                                )}
                                <p className="text-[10px] text-gray-500 mt-1">Wyszukaj po kodzie lub nazwie, aby przypisać lakier z bazy.</p>
                            </div>
                        )}
                    </div>

                    {/* Specyfikacja Card */}
                    <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-6">Specyfikacja</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-700 mb-2">Rodzaj paliwa</label>
                                    <input
                                        type="text"
                                        value={fuelType}
                                        onChange={(e) => setFuelType(e.target.value)}
                                        placeholder="e.g. Diesel"
                                        className="w-full p-2 border border-gray-300 rounded-sm text-sm text-gray-900 placeholder:text-gray-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-700 mb-2">Moc (KM/kW)</label>
                                    <input
                                        type="text"
                                        value={power}
                                        onChange={(e) => setPower(e.target.value)}
                                        placeholder="e.g. 286 KM"
                                        className="w-full p-2 border border-gray-300 rounded-sm text-sm text-gray-900 placeholder:text-gray-400"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-700 mb-2">Układ napędowy</label>
                                <input
                                    type="text"
                                    value={drivetrain}
                                    onChange={(e) => setDrivetrain(e.target.value)}
                                    placeholder="e.g. xDrive"
                                    className="w-full p-2 border border-gray-300 rounded-sm text-sm text-gray-900 placeholder:text-gray-400"
                                />
                            </div>
                        </div>
                    </div>
                    {/* Danger Zone */}
                    <div className="bg-red-50 p-6 rounded-sm shadow-sm border border-red-100">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-red-900 mb-4">Danger Zone</h3>
                        <p className="text-xs text-red-700 mb-4">
                            Actions here are irreversible. Use with caution.
                        </p>
                        <button
                            onClick={async () => {
                                if (!confirm('Are you sure? This will DELETE ALL PHOTOS for this car from the server. This cannot be undone.')) return;

                                setSaving(true);
                                try {
                                    const res = await fetch('/api/admin/purge-images', {
                                        method: 'POST',
                                        body: JSON.stringify({ vin: car.vin }),
                                        headers: { 'Content-Type': 'application/json' }
                                    });

                                    if (!res.ok) throw new Error('Purge failed');

                                    const data = await res.json();
                                    setCar({ ...car, images: [] });
                                    setMsg({ type: 'success', text: `Storage cleaned. Deleted ${data.count} files.` });
                                } catch (e) {
                                    setMsg({ type: 'error', text: 'Failed to purge images.' });
                                } finally {
                                    setSaving(false);
                                }
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all rounded-sm text-xs font-bold uppercase tracking-wide"
                        >
                            <Trash2 className="w-3 h-3" />
                            Purge All Images (Sold)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
