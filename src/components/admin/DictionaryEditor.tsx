'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Plus, Loader2, Save, Edit, Search, X } from 'lucide-react';
import { DictionaryImageUploader } from './DictionaryImageUploader';
import { cn } from '@/lib/utils';

type DictionaryType = 'model' | 'color' | 'upholstery' | 'option';

interface DictionaryItem {
    id: string;
    type: DictionaryType;
    code: string;
    data: any;
}

interface DictionaryEditorProps {
    type: DictionaryType;
    title: string;
}

export function DictionaryEditor({ type, title }: DictionaryEditorProps) {
    const [items, setItems] = useState<DictionaryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [bodyGroups, setBodyGroups] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'date' | 'code'>('date');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Form state
    const [newCode, setNewCode] = useState('');
    const [formData, setFormData] = useState<any>({});

    // Variation state
    const [hasVariations, setHasVariations] = useState(false);
    const [variations, setVariations] = useState<{ id: string, body_groups: string[], image: string }[]>([]);

    const addVariationRow = () => {
        setVariations([...variations, { id: crypto.randomUUID(), body_groups: [], image: '' }]);
    };

    const removeVariationRow = (id: string) => {
        setVariations(variations.filter(v => v.id !== id));
    };

    const updateVariation = (id: string, field: 'body_groups' | 'image', value: any) => {
        setVariations(variations.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    // Filter items
    const filteredItems = items.filter(item => {
        if (!debouncedQuery) return true;
        const q = debouncedQuery.toLowerCase();
        const codeMatch = item.code.toLowerCase().includes(q);
        const nameMatch = item.data?.name?.toLowerCase().includes(q);
        return codeMatch || nameMatch;
    });

    const fetchItems = async () => {
        setIsLoading(true);
        const orderColumn = sortBy === 'date' ? 'created_at' : 'code';
        const { data, error } = await supabase
            .from('dictionaries')
            .select('*')
            .eq('type', type)
            .order(orderColumn, { ascending: sortBy === 'code' });

        if (error) {
            console.error('Error fetching dictionaries:', error);
        } else {
            setItems(data || []);
        }
        setIsLoading(false);
    };

    const fetchBodyGroups = async () => {
        const { data, error } = await supabase
            .from('stock_units')
            .select('body_group');

        if (error) {
            console.error('Error fetching body groups:', error);
        } else {
            console.log('Raw body group data:', data);
            // Get unique body groups, filter out null/empty, and sort them
            const unique = Array.from(
                new Set(
                    data
                        ?.map(d => d.body_group)
                        .filter(bg => bg && bg.trim() !== '')
                )
            ).sort();
            console.log('Unique body groups:', unique);
            setBodyGroups(unique);
        }
    };

    useEffect(() => {
        fetchItems();
        if (type === 'option') {
            fetchBodyGroups();
        }
    }, [type, sortBy]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCode) return;

        setIsSaving(true);
        const payloadData = { ...formData };
        if (hasVariations) {
            payloadData.variations = variations.map(({ id, ...v }) => v); // Remove temp ID
        }

        const { error } = await supabase
            .from('dictionaries')
            .upsert({
                type,
                code: newCode,
                data: payloadData
            }, { onConflict: 'type,code' });

        if (error) {
            alert('Error saving dictionary item: ' + error.message);
        } else {
            setNewCode('');
            setFormData({});
            setHasVariations(false);
            setVariations([]);
            fetchItems();
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: string, code: string) => {
        if (!confirm(`Are you sure you want to delete ${code}? This will also delete any associated image.`)) return;

        try {
            const res = await fetch('/api/admin/dictionary/delete', {
                method: 'POST',
                body: JSON.stringify({ id }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) throw new Error('Delete failed');

            fetchItems();
        } catch (e: any) {
            alert('Error deleting item: ' + e.message);
        }
    };

    const handleEdit = (item: DictionaryItem) => {
        setEditingId(item.id);
    };

    const handleSaveEdit = async (item: DictionaryItem) => {
        const { error } = await supabase
            .from('dictionaries')
            .update({
                code: item.code,
                data: item.data
            })
            .eq('id', item.id);

        if (error) {
            alert('Error updating item: ' + error.message);
        } else {
            setEditingId(null);
            fetchItems();
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        fetchItems(); // Refresh to discard changes
    };

    const handleEditDataChange = (itemId: string, key: string, value: any) => {
        setItems(prev => prev.map(item =>
            item.id === itemId
                ? { ...item, data: { ...item.data, [key]: value } }
                : item
        ));
    };

    const handleDataChange = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="bg-white border border-gray-100 shadow-sm rounded-sm">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-lg font-light text-gray-900">{title}</h3>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 pr-3 py-1 text-sm border border-gray-200 rounded-sm focus:outline-none focus:border-black w-48 transition-colors"
                        />
                    </div>
                    <div className="flex bg-gray-50 p-1 rounded-sm border border-gray-100">
                        <button
                            onClick={() => setSortBy('date')}
                            className={cn(
                                "px-3 py-1 text-xs transition-all rounded-sm",
                                sortBy === 'date' ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            Date Added
                        </button>
                        <button
                            onClick={() => setSortBy('code')}
                            className={cn(
                                "px-3 py-1 text-xs transition-all rounded-sm",
                                sortBy === 'code' ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            Code
                        </button>
                    </div>
                    <span className="text-xs bg-gray-50 text-gray-400 px-2 py-1 rounded-full uppercase tracking-wider">
                        {filteredItems.length} items
                    </span>
                </div>
            </div>

            {/* Add New Form */}
            <form onSubmit={handleAdd} className="p-6 bg-gray-50/50 border-b border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Code</label>
                        <input
                            type="text"
                            value={newCode}
                            onChange={(e) => setNewCode(e.target.value)}
                            placeholder="e.g. 475"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-sm focus:outline-none focus:border-black transition-colors text-sm"
                            required
                        />
                    </div>
                    {type === 'model' ? (
                        <>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Series</label>
                                <input
                                    type="text"
                                    value={formData.series || ''}
                                    onChange={(e) => handleDataChange('series', e.target.value)}
                                    placeholder="e.g. Seria 3"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-sm focus:outline-none focus:border-black transition-colors text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={(e) => handleDataChange('name', e.target.value)}
                                    placeholder="e.g. 320d xDrive"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-sm focus:outline-none focus:border-black transition-colors text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Body Type</label>
                                <input
                                    type="text"
                                    value={formData.body_type || ''}
                                    onChange={(e) => handleDataChange('body_type', e.target.value)}
                                    placeholder="e.g. Hatchback"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-sm focus:outline-none focus:border-black transition-colors text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Fuel</label>
                                <input
                                    type="text"
                                    value={formData.fuel || ''}
                                    onChange={(e) => handleDataChange('fuel', e.target.value)}
                                    placeholder="e.g. Diesel"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-sm focus:outline-none focus:border-black transition-colors text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Drivetrain</label>
                                <input
                                    type="text"
                                    value={formData.drivetrain || ''}
                                    onChange={(e) => handleDataChange('drivetrain', e.target.value)}
                                    placeholder="e.g. xDrive"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-sm focus:outline-none focus:border-black transition-colors text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Power [KM]</label>
                                <input
                                    type="text"
                                    value={formData.power || ''}
                                    onChange={(e) => handleDataChange('power', e.target.value)}
                                    placeholder="e.g. 190"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-sm focus:outline-none focus:border-black transition-colors text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Accel 0-100</label>
                                <input
                                    type="text"
                                    value={formData.acceleration || ''}
                                    onChange={(e) => handleDataChange('acceleration', e.target.value)}
                                    placeholder="e.g. 7.5"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-sm focus:outline-none focus:border-black transition-colors text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Trunk [l]</label>
                                <input
                                    type="text"
                                    value={formData.trunk_capacity || ''}
                                    onChange={(e) => handleDataChange('trunk_capacity', e.target.value)}
                                    placeholder="e.g. 480"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-sm focus:outline-none focus:border-black transition-colors text-sm"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={(e) => handleDataChange('name', e.target.value)}
                                    placeholder="e.g. Sapphire Black"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-sm focus:outline-none focus:border-black transition-colors text-sm"
                                    required
                                />
                                <div className="mt-3 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="new-visible"
                                        checked={formData.visible !== false}
                                        onChange={(e) => handleDataChange('visible', e.target.checked)}
                                        className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                                    />
                                    <label htmlFor="new-visible" className="text-sm text-gray-600">Visible on site</label>
                                </div>
                            </div>
                            {type === 'upholstery' && (
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Type</label>
                                    <select
                                        value={formData.type || ''}
                                        onChange={(e) => handleDataChange('type', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-sm focus:outline-none focus:border-black transition-colors text-sm"
                                    >
                                        <option value="">Select type...</option>
                                        <option value="Materiał">Materiał</option>
                                        <option value="Alcantara">Alcantara</option>
                                        <option value="Skóra ekologiczna">Skóra ekologiczna</option>
                                        <option value="Skóra naturalna">Skóra naturalna</option>
                                    </select>
                                </div>
                            )}
                            {type === 'option' && (
                                <div className="col-span-full bg-white p-4 border border-gray-100 rounded-sm mt-2">
                                    <div className="flex items-center gap-2 mb-4">
                                        <input
                                            type="checkbox"
                                            id="has-variations"
                                            checked={hasVariations}
                                            onChange={(e) => {
                                                setHasVariations(e.target.checked);
                                                if (e.target.checked && variations.length === 0) {
                                                    addVariationRow();
                                                }
                                            }}
                                            className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                                        />
                                        <label htmlFor="has-variations" className="text-sm font-medium text-gray-700">
                                            Body Group Specific (Advanced)
                                        </label>
                                    </div>

                                    {hasVariations && (
                                        <div className="space-y-3">
                                            {variations.map((variation, index) => (
                                                <div key={variation.id} className="flex items-start gap-4 p-3 bg-gray-50 border border-gray-200 rounded-sm">
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                                                            Body Groups
                                                        </label>
                                                        <select
                                                            multiple
                                                            value={variation.body_groups}
                                                            onChange={(e) => updateVariation(variation.id, 'body_groups', Array.from(e.target.selectedOptions, o => o.value))}
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-sm text-sm h-24"
                                                        >
                                                            {bodyGroups.map(bg => (
                                                                <option key={bg} value={bg}>{bg}</option>
                                                            ))}
                                                        </select>
                                                        <p className="text-xs text-gray-400 mt-1">Hold Cmd/Ctrl to select multiple</p>
                                                    </div>

                                                    <div className="w-48">
                                                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                                                            Variation Image
                                                        </label>
                                                        {variation.image ? (
                                                            <div className="relative group w-20 h-20 bg-gray-100 border border-gray-200 rounded-sm">
                                                                <img src={variation.image} alt="Var" className="w-full h-full object-cover" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateVariation(variation.id, 'image', '')}
                                                                    className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <DictionaryImageUploader
                                                                dictionaryType={type}
                                                                code={`${newCode}-var-${index}`}
                                                                onUploadComplete={(url) => updateVariation(variation.id, 'image', url)}
                                                            />
                                                        )}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => removeVariationRow(variation.id)}
                                                        className="mt-6 text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={addVariationRow}
                                                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium px-2 py-1"
                                            >
                                                <Plus className="w-3 h-3" />
                                                Add Another Variant
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full bg-black text-white px-4 py-2 rounded-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Add Item
                        </button>
                    </div>
                </div>
            </form>

            {/* List */}
            <div className="max-h-[500px] overflow-y-auto">
                {isLoading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 text-sm italic">
                        No items found for this category.
                    </div>
                ) : (
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="sticky top-0 bg-white shadow-sm z-10">
                            <tr className="border-b border-gray-100">
                                <th className="px-6 py-3 font-semibold text-gray-900 w-24">Image</th>
                                <th className="px-6 py-3 font-semibold text-gray-900 w-24">Visible</th>
                                <th className="px-6 py-3 font-semibold text-gray-900 w-24">Code</th>
                                <th className="px-6 py-3 font-semibold text-gray-900">Details</th>
                                <th className="px-6 py-3 font-semibold text-gray-900 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <DictionaryImageUploader
                                            currentImage={item.data.image}
                                            dictionaryType={type}
                                            code={item.code}
                                            onUploadComplete={async (url) => {
                                                const newData = { ...item.data, image: url };
                                                await supabase
                                                    .from('dictionaries')
                                                    .update({ data: newData })
                                                    .eq('id', item.id);
                                                fetchItems();
                                            }}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                checked={item.data.visible !== false} // Default to true if undefined
                                                onChange={async (e) => {
                                                    const newData = { ...item.data, visible: e.target.checked };
                                                    await supabase
                                                        .from('dictionaries')
                                                        .update({ data: newData })
                                                        .eq('id', item.id);
                                                    fetchItems();
                                                }}
                                                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-500">
                                        {editingId === item.id ? (
                                            <input
                                                type="text"
                                                value={item.code}
                                                onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, code: e.target.value } : i))}
                                                className="w-full px-2 py-1 border border-gray-300 rounded-sm focus:outline-none focus:border-black text-sm font-mono"
                                            />
                                        ) : (
                                            item.code
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">
                                        {editingId === item.id ? (
                                            <div className="flex flex-col gap-2">
                                                <input
                                                    type="text"
                                                    value={item.data.name || ''}
                                                    onChange={(e) => handleEditDataChange(item.id, 'name', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded-sm focus:outline-none focus:border-black text-sm"
                                                    placeholder="Name"
                                                />
                                                {type === 'option' && (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                id={`edit-bg-${item.id}`}
                                                                checked={item.data.body_groups && item.data.body_groups.length > 0}
                                                                onChange={(e) => {
                                                                    if (!e.target.checked) {
                                                                        handleEditDataChange(item.id, 'body_groups', []);
                                                                    } else {
                                                                        handleEditDataChange(item.id, 'body_groups', []);
                                                                    }
                                                                }}
                                                                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                                                            />
                                                            <label htmlFor={`edit-bg-${item.id}`} className="text-xs text-gray-600">Body Group Specific</label>
                                                        </div>
                                                        {item.data.body_groups && item.data.body_groups.length >= 0 && (
                                                            <select
                                                                multiple
                                                                value={item.data.body_groups || []}
                                                                onChange={(e) => handleEditDataChange(item.id, 'body_groups', Array.from(e.target.selectedOptions, option => option.value))}
                                                                className="w-full px-2 py-1 border border-gray-300 rounded-sm focus:outline-none focus:border-black text-sm"
                                                                size={Math.min(bodyGroups.length, 6)}
                                                            >
                                                                {bodyGroups.map(bg => (
                                                                    <option key={bg} value={bg}>{bg}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                {type === 'model' ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{item.data.name}</span>
                                                        <span className="text-xs text-gray-400">
                                                            {item.data.series} • {item.data.body_type} • {item.data.fuel} • {item.data.drivetrain}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <span>{item.data.name}</span>
                                                        {type === 'upholstery' && item.data.type && (
                                                            <span className="text-xs text-gray-400 mt-0.5">{item.data.type}</span>
                                                        )}
                                                        {item.data.variations && item.data.variations.length > 0 && (
                                                            <div className="mt-2 text-xs">
                                                                <span className="font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-sm">
                                                                    {item.data.variations.length} Variants
                                                                </span>
                                                                <div className="text-gray-400 mt-1 pl-1 border-l-2 border-gray-100">
                                                                    {item.data.variations.map((v: any, idx: number) => (
                                                                        <div key={idx} className="truncate max-w-[200px]" title={v.body_groups.join(', ')}>
                                                                            • {v.body_groups.join(', ')}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {editingId === item.id ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleSaveEdit(item)}
                                                    className="text-green-600 hover:text-green-700 p-2 transition-colors"
                                                    title="Save"
                                                >
                                                    <Save className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="text-gray-400 hover:text-gray-600 p-2 transition-colors"
                                                    title="Cancel"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="text-blue-500 hover:text-blue-600 p-2 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id, item.code)}
                                                    className="text-gray-300 hover:text-red-500 p-2 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div >
    );
}
