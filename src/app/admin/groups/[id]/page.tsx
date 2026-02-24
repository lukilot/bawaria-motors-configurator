'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ProductGroup, StockCar } from '@/types/stock';
import { compressImage } from '@/lib/image-utils';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Upload, Trash2, CheckCircle, Package, Edit, Eye } from 'lucide-react';
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

// Helper component for Sortable Image
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
                alt="Car Group"
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

export default function AdminGroupEditor() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    // State
    const [group, setGroup] = useState<ProductGroup | null>(null);
    const [units, setUnits] = useState<StockCar[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form State
    const [manualPrice, setManualPrice] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [modelName, setModelName] = useState<string>('');

    // DND Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Fetch Group Data
    useEffect(() => {
        if (!id) return;
        const fetchGroup = async () => {
            // 1. Fetch Group
            const { data: groupData, error: groupError } = await supabase
                .from('product_groups')
                .select('*')
                .eq('id', id)
                .single();

            if (groupError) {
                console.error('Error fetching group:', groupError);
                setLoading(false);
                return;
            }

            // 2. Fetch Units
            const { data: unitsData, error: unitsError } = await supabase
                .from('stock_units')
                .select('*')
                .eq('product_group_id', id);

            if (groupData) {
                setGroup({ ...groupData, available_units: unitsData || [] });
                setUnits(unitsData || []);
                setManualPrice(groupData.manual_price ? String(groupData.manual_price) : '');
                setDescription(groupData.description || '');

                // Enrich model name from Knowledge Base
                const { data: dictData } = await supabase
                    .from('dictionaries')
                    .select('data')
                    .eq('type', 'model')
                    .eq('code', groupData.model_code)
                    .single();

                setModelName(dictData?.data?.name || groupData.model_code);
            }
            setLoading(false);
        };
        fetchGroup();
    }, [id]);

    // Save Handler (Metadata)
    const handleSave = async () => {
        setSaving(true);
        setMsg(null);

        try {
            const updates = {
                manual_price: manualPrice ? parseFloat(manualPrice) : null,
                description: description || null,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('product_groups')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            setMsg({ type: 'success', text: 'Group settings saved successfully.' });
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
        if (!over || active.id === over.id || !group) return;

        const oldIndex = group.images?.findIndex((img) => img.id === active.id) ?? -1;
        const newIndex = group.images?.findIndex((img) => img.id === over.id) ?? -1;

        if (oldIndex !== -1 && newIndex !== -1) {
            const newImages = arrayMove(group.images!, oldIndex, newIndex).map((img, i) => ({
                ...img,
                sort_order: i
            }));

            // Sync with DB
            const { error } = await supabase
                .from('product_groups')
                .update({ images: newImages })
                .eq('id', group.id);

            if (!error) {
                setGroup({ ...group, images: newImages });
            }
        }
    };

    const handleDeleteImage = async (imgId: string) => {
        if (!group || !group.images) return;
        if (!confirm('Are you sure you want to delete this image?')) return;

        const newImages = group.images.filter(img => img.id !== imgId);

        const { error } = await supabase
            .from('product_groups')
            .update({ images: newImages })
            .eq('id', group.id);

        if (!error) {
            setGroup({ ...group, images: newImages });
            setMsg({ type: 'success', text: 'Image deleted.' });
        } else {
            setMsg({ type: 'error', text: 'Failed to delete image.' });
        }
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!group) return;
        setUploading(true);

        try {
            const newImages = [...(group.images || [])];

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
                // Pass the original file name as the 3rd argument since fileToUpload might be a Blob now
                formData.append('file', fileToUpload, file.name.replace(/\.[^/.]+$/, "") + ".webp");
                formData.append('groupId', group.id); // Identifying as group upload

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
                .from('product_groups')
                .update({ images: newImages })
                .eq('id', group.id);

            if (dbError) throw dbError;

            setGroup({ ...group, images: newImages });
            setMsg({ type: 'success', text: `Uploaded ${acceptedFiles.length} images.` });

        } catch (e: any) {
            console.error(e);
            setMsg({ type: 'error', text: 'Upload failed: ' + e.message });
        } finally {
            setUploading(false);
        }
    }, [group]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    if (loading) return <div className="p-12 text-center text-gray-500 font-light">Loading group data...</div>;
    if (!group) return <div className="p-12 text-center text-red-500">Group not found.</div>;

    // Price Stats — use group manual_price as fallback for units with no price
    const groupManualPrice = manualPrice ? parseFloat(manualPrice) : 0;
    const prices = units.map(u => {
        const unitPrice = u.special_price || u.list_price;
        return unitPrice > 0 ? unitPrice : groupManualPrice;
    }).filter(p => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            <header className="bg-white border-b border-gray-100 py-6 px-8 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-light text-gray-900 tracking-tight">Edit Product Group</h1>
                        <p className="text-xs text-gray-600 font-mono">{group.signature.substring(0, 16)}...</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-black text-white hover:bg-gray-800 transition-all rounded-sm font-medium text-sm tracking-wide disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Group
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Images & Units */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Image Manager */}
                    <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Shared Gallery</h3>
                                <p className="text-[10px] text-gray-500 uppercase mt-1">Photos upload here apply to ALL cars in this group.</p>
                            </div>
                            {group.images && group.images.length > 0 && (
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-sm">
                                    {group.images.length} Photos
                                </span>
                            )}
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={group.images?.map(img => img.id) || []}
                                strategy={rectSortingStrategy}
                            >
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                                    {group.images?.map((img: any, i: number) => (
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

                    {/* Associated Units */}
                    <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-6">Stock Units ({units.length})</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3">VIN</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Price</th>
                                        <th className="px-4 py-3">Images</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {units.map(unit => {
                                        const hasOwnImages = unit.images && unit.images.length > 0;
                                        const isActive = unit.status_code !== 500;

                                        return (
                                            <tr key={unit.vin} className={cn("hover:bg-gray-50", !isActive && "opacity-60")}>
                                                <td className="px-4 py-3 font-mono text-xs text-gray-800">{unit.vin}</td>
                                                <td className="px-4 py-3">
                                                    <span className={cn(
                                                        "px-1.5 py-0.5 rounded-sm text-[10px] font-bold",
                                                        unit.status_code >= 190 ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
                                                    )}>
                                                        {unit.status_code}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-gray-800">
                                                    {(() => {
                                                        const unitPrice = unit.special_price || unit.list_price;
                                                        if (unitPrice > 0) {
                                                            return new Intl.NumberFormat('pl-PL').format(unitPrice);
                                                        } else if (groupManualPrice > 0) {
                                                            return <span className="text-blue-600">{new Intl.NumberFormat('pl-PL').format(groupManualPrice)} <span className="text-[9px] text-blue-400">(GROUP)</span></span>;
                                                        }
                                                        return <span className="text-red-400">0</span>;
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {hasOwnImages ? (
                                                        <span className="text-green-600 text-[10px] font-bold">OWN</span>
                                                    ) : (
                                                        <span className="text-gray-600 text-[10px]">Inherited</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Link
                                                        href={`/admin/cars/${unit.vin}`}
                                                        className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs font-medium uppercase"
                                                    >
                                                        <Edit className="w-3 h-3" /> Edit
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings */}
                <div className="space-y-6">
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
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-6">Group Configuration</h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-gray-700 text-[10px] uppercase font-bold mb-1">Model</label>
                                <p className="font-medium text-lg text-gray-900">{modelName}</p>
                                <p className="font-mono text-xs text-gray-700">{group.model_code}</p>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-[10px] uppercase font-bold mb-1">Specs</label>
                                <div className="flex gap-2">
                                    <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs font-mono">{group.color_code}</span>
                                    <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs font-mono">{group.upholstery_code}</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-6 mb-6">
                            <label className="block text-xs font-semibold uppercase text-gray-700 mb-2">Catalogue Price (PLN)</label>
                            <input
                                type="number"
                                value={manualPrice}
                                onChange={(e) => setManualPrice(e.target.value)}
                                placeholder="Catalogue price for all units..."
                                className="w-full p-2 border border-gray-300 rounded-sm text-sm text-gray-900 focus:border-blue-500 outline-none font-bold placeholder:text-gray-400"
                            />
                            <p className="text-[10px] text-gray-600 mt-1">
                                Sets the catalogue price (before discount) for all units in this group.
                                <br />Current Range: <b>{new Intl.NumberFormat('pl-PL').format(minPrice)} - {new Intl.NumberFormat('pl-PL').format(maxPrice)} PLN</b>
                            </p>
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <label className="block text-xs font-semibold uppercase text-gray-700 mb-2">Description / Note</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full p-2 border border-gray-300 rounded-sm text-sm text-gray-900 placeholder:text-gray-400"
                                placeholder="Internal notes or public description..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
