'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Bulletin, BulletinRule } from '@/lib/bulletin-fetch';
import { CHASSIS_MAPPING } from '@/lib/chassis-mapping';
import { Loader2, Plus, Edit, Trash2, X, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ModelDictEntry {
    code: string;
    name: string;
    body_group?: string;
}

// Derive body groups from chassis mapping (starting set)
const CHASSIS_BODY_GROUPS = [...new Set(Object.values(CHASSIS_MAPPING))].sort();

function emptyRule(): BulletinRule {
    return {
        model_codes: [],
        body_groups: [],
        production_year_min: undefined,
        production_year_max: undefined,
        discount_amount: 0,
        discount_percent: 0,
    };
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function BulletinManager() {
    const [bulletins, setBulletins] = useState<Bulletin[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBulletin, setEditingBulletin] = useState<Bulletin | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Model dictionary for autocomplete
    const [modelDict, setModelDict] = useState<ModelDictEntry[]>([]);
    // Body groups from actual stock
    const [stockBodyGroups, setStockBodyGroups] = useState<string[]>([]);

    useEffect(() => {
        loadBulletins();
        loadModelDictionary();
        loadStockBodyGroups();
    }, []);

    const loadBulletins = async () => {
        setLoading(true);
        try {
            const resp = await fetch('/api/admin/bulletins');
            if (!resp.ok) throw new Error('Failed to fetch bulletins');
            const data = await resp.json();
            setBulletins(data);
        } catch (err: any) {
            setError(err.message);
        }
        setLoading(false);
    };

    const loadModelDictionary = async () => {
        try {
            const resp = await fetch('/api/admin/bulletins?dict=model');
            if (!resp.ok) return;
            const data = await resp.json();
            if (Array.isArray(data)) {
                setModelDict(data);
            }
        } catch {
            // Silent fail — autocomplete just won't work
        }
    };

    const loadStockBodyGroups = async () => {
        try {
            const resp = await fetch('/api/admin/bulletins?dict=bodygroups');
            if (!resp.ok) return;
            const data = await resp.json();
            if (Array.isArray(data)) {
                setStockBodyGroups(data);
            }
        } catch {
            // Silent fail
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Na pewno chcesz usunąć ten biuletyn?')) return;
        const resp = await fetch(`/api/admin/bulletins?id=${id}`, { method: 'DELETE' });
        if (resp.ok) loadBulletins();
        else alert('Error deleting bulletin');
    };

    const handleToggleActive = async (bulletin: Bulletin) => {
        const resp = await fetch('/api/admin/bulletins', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: bulletin.id, is_active: !bulletin.is_active }),
        });
        if (resp.ok) loadBulletins();
        else alert('Error toggling bulletin');
    };

    const handleSave = async (formData: Partial<Bulletin>) => {
        setSaving(true);
        try {
            const method = editingBulletin ? 'PUT' : 'POST';
            const body = editingBulletin ? { ...formData, id: editingBulletin.id } : formData;

            const resp = await fetch('/api/admin/bulletins', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.error || 'Failed to save');
            }

            setIsModalOpen(false);
            setEditingBulletin(null);
            loadBulletins();
        } catch (err: any) {
            alert(err.message);
        }
        setSaving(false);
    };

    const formatRulesSummary = (rules: BulletinRule[]) => {
        if (!rules || rules.length === 0) return 'Brak zasad';
        return `${rules.length} ${rules.length === 1 ? 'zasada' : rules.length < 5 ? 'zasady' : 'zasad'} rabatowych`;
    };

    const formatRuleShort = (rule: BulletinRule, modelDict: ModelDictEntry[]) => {
        const parts: string[] = [];

        if (rule.model_codes && rule.model_codes.length > 0) {
            const modelNames = rule.model_codes.map(code => {
                const entry = modelDict.find(m => m.code === code);
                return entry ? `${code} (${entry.name})` : code;
            });
            parts.push(modelNames.join(', '));
        }
        if (rule.body_groups && rule.body_groups.length > 0) {
            parts.push(`Seria: ${rule.body_groups.join(', ')}`);
        }
        if (rule.production_year_min || rule.production_year_max) {
            parts.push(`Rok: ${rule.production_year_min || '...'}–${rule.production_year_max || '...'}`);
        }

        const discount: string[] = [];
        if (rule.discount_percent > 0) discount.push(`${rule.discount_percent}%`);
        if (rule.discount_amount > 0) discount.push(`${rule.discount_amount.toLocaleString()} PLN`);

        const targetStr = parts.length > 0 ? parts.join(' · ') : 'Wszystkie pojazdy';
        return `${targetStr} → ${discount.join(' + ') || 'brak'}`;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Warunki Sprzedaży</h1>
                    <p className="text-gray-500 text-sm">Zarządzaj biuletynami rabatowymi. Rabaty automatycznie naliczane na SRP i VDP.</p>
                </div>
                <button
                    onClick={() => { setEditingBulletin(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-sm hover:bg-gray-800 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Dodaj Biuletyn
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-sm mb-6 text-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-500" /></div>
            ) : bulletins.length === 0 ? (
                <div className="py-20 text-center text-gray-500">
                    <p className="text-lg font-light mb-2">Brak biuletynów</p>
                    <p className="text-sm">Kliknij "Dodaj Biuletyn" aby utworzyć pierwszy biuletyn rabatowy.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {bulletins.map(b => (
                        <div key={b.id} className={cn(
                            "bg-white border rounded-sm p-5 hover:shadow-sm transition-all",
                            b.is_active ? "border-gray-200" : "border-gray-100 opacity-60"
                        )}>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-gray-900">{b.name}</h3>
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm",
                                            b.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"
                                        )}>
                                            {b.is_active ? 'Aktywny' : 'Nieaktywny'}
                                        </span>
                                    </div>

                                    {b.description && (
                                        <p className="text-sm text-gray-500 mb-2">{b.description}</p>
                                    )}

                                    <div className="flex flex-wrap gap-3 mt-3">
                                        <span className="text-xs font-bold text-gray-800 bg-yellow-50 px-2 py-1 rounded-sm border border-yellow-100">
                                            📋 {formatRulesSummary(b.rules)}
                                        </span>

                                        {(b.valid_from || b.valid_until) && (
                                            <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-sm border border-blue-100">
                                                📅 {b.valid_from || '...'} → {b.valid_until || '...'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Rules preview */}
                                    {b.rules && b.rules.length > 0 && (
                                        <div className="mt-3 space-y-1">
                                            {b.rules.map((rule, i) => (
                                                <div key={i} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                    🎯 {formatRuleShort(rule, modelDict)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 ml-4 shrink-0">
                                    <button
                                        onClick={() => handleToggleActive(b)}
                                        className={cn("p-2 rounded transition-colors", b.is_active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100")}
                                        title={b.is_active ? 'Dezaktywuj' : 'Aktywuj'}
                                    >
                                        {b.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={() => { setEditingBulletin(b); setIsModalOpen(true); }}
                                        className="p-2 hover:bg-gray-100 rounded text-gray-600"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(b.id)}
                                        className="p-2 hover:bg-red-50 rounded text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <BulletinModal
                    bulletin={editingBulletin}
                    onClose={() => { setIsModalOpen(false); setEditingBulletin(null); }}
                    onSave={handleSave}
                    saving={saving}
                    modelDict={modelDict}
                    stockBodyGroups={stockBodyGroups}
                />
            )}
        </div>
    );
}

// ─── Autocomplete/Searchable Input Component ─────────────────────────────────

interface AutocompleteOption {
    value: string;
    label: string;
    sublabel?: string;
}

function SearchableSelect({
    options,
    selected,
    onSelect,
    onRemove,
    placeholder,
}: {
    options: AutocompleteOption[];
    selected: string[];
    onSelect: (value: string) => void;
    onRemove: (value: string) => void;
    placeholder: string;
}) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const filtered = useMemo(() => {
        if (!query.trim()) return options.slice(0, 30);
        const q = query.toLowerCase();
        return options.filter(o =>
            o.value.toLowerCase().includes(q) ||
            o.label.toLowerCase().includes(q) ||
            (o.sublabel && o.sublabel.toLowerCase().includes(q))
        ).slice(0, 30);
    }, [options, query]);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <div className="flex items-center border border-gray-300 rounded bg-white">
                <Search className="w-3.5 h-3.5 text-gray-400 ml-2 shrink-0" />
                <input
                    className="flex-1 p-2 text-sm outline-none bg-transparent"
                    placeholder={placeholder}
                    value={query}
                    onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                />
            </div>

            {isOpen && filtered.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
                    {filtered.map(opt => {
                        const isSelected = selected.includes(opt.value);
                        return (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    if (isSelected) {
                                        onRemove(opt.value);
                                    } else {
                                        onSelect(opt.value);
                                    }
                                    setQuery('');
                                }}
                                className={cn(
                                    "w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between items-center gap-2",
                                    isSelected && "bg-blue-50 text-blue-700"
                                )}
                            >
                                <div className="flex flex-col min-w-0">
                                    <span className="font-mono text-xs">{opt.value}</span>
                                    {opt.label !== opt.value && (
                                        <span className="text-gray-500 text-[11px] truncate">{opt.label}</span>
                                    )}
                                </div>
                                {isSelected && <span className="text-blue-600 shrink-0">✓</span>}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Selected badges */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {selected.map(val => {
                        const opt = options.find(o => o.value === val);
                        return (
                            <span key={val} className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2 py-0.5 rounded text-xs font-mono">
                                {opt ? `${val} — ${opt.label}` : val}
                                <button onClick={() => onRemove(val)} className="text-red-400 hover:text-red-600">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Bulletin Modal ──────────────────────────────────────────────────────────

interface BulletinModalProps {
    bulletin: Bulletin | null;
    onClose: () => void;
    onSave: (data: Partial<Bulletin>) => void;
    saving: boolean;
    modelDict: ModelDictEntry[];
    stockBodyGroups: string[];
}

function BulletinModal({ bulletin, onClose, onSave, saving, modelDict, stockBodyGroups }: BulletinModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [rules, setRules] = useState<BulletinRule[]>([emptyRule()]);
    const [isActive, setIsActive] = useState(true);
    const [validFrom, setValidFrom] = useState('');
    const [validUntil, setValidUntil] = useState('');

    useEffect(() => {
        if (bulletin) {
            setName(bulletin.name);
            setDescription(bulletin.description || '');
            setRules(bulletin.rules && bulletin.rules.length > 0 ? bulletin.rules : [emptyRule()]);
            setIsActive(bulletin.is_active);
            setValidFrom(bulletin.valid_from || '');
            setValidUntil(bulletin.valid_until || '');
        }
    }, [bulletin]);

    // Build model code options from dictionary
    const modelOptions: AutocompleteOption[] = useMemo(() =>
        modelDict.map(m => ({
            value: m.code,
            label: m.name || m.code,
            sublabel: m.body_group,
        })),
        [modelDict]
    );

    // Build body group options from chassis mapping + model dictionary + actual stock
    const bodyGroupOptions: AutocompleteOption[] = useMemo(() => {
        const groups = new Set<string>(CHASSIS_BODY_GROUPS);

        // Add body groups from model dictionary entries
        modelDict.forEach(m => {
            if (m.body_group) groups.add(m.body_group);
        });

        // Add body groups from actual stock data (product_groups table)
        stockBodyGroups.forEach(bg => groups.add(bg));

        return [...groups].sort().map(bg => ({
            value: bg,
            label: bg,
        }));
    }, [modelDict, stockBodyGroups]);

    const updateRule = useCallback((index: number, partial: Partial<BulletinRule>) => {
        setRules(prev => prev.map((r, i) => i === index ? { ...r, ...partial } : r));
    }, []);

    const removeRule = useCallback((index: number) => {
        setRules(prev => prev.filter((_, i) => i !== index));
    }, []);

    const addRule = useCallback(() => {
        setRules(prev => [...prev, emptyRule()]);
    }, []);

    const handleSubmit = () => {
        if (!name.trim()) {
            alert('Nazwa biuletynu jest wymagana.');
            return;
        }
        const validRules = rules.filter(r =>
            (r.discount_amount || 0) > 0 || (r.discount_percent || 0) > 0
        );
        if (validRules.length === 0) {
            alert('Dodaj co najmniej jedną zasadę z rabatem.');
            return;
        }
        onSave({
            name,
            description: description || undefined,
            rules: validRules,
            is_active: isActive,
            valid_from: validFrom || undefined,
            valid_until: validUntil || undefined,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold">{bulletin ? 'Edytuj Biuletyn' : 'Nowy Biuletyn'}</h2>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
                </div>

                <div className="space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nazwa biuletynu *</label>
                        <input
                            className="w-full border border-gray-300 rounded p-2.5 text-sm"
                            placeholder="np. Biuletyn Wyprzedaż Seria M"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Opis (opcjonalny)</label>
                        <textarea
                            className="w-full border border-gray-300 rounded p-2.5 text-sm resize-none"
                            rows={2}
                            placeholder="Notatki admin..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Validity Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ważny od</label>
                            <input
                                type="date"
                                className="w-full border border-gray-300 rounded p-2.5 text-sm"
                                value={validFrom}
                                onChange={e => setValidFrom(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ważny do</label>
                            <input
                                type="date"
                                className="w-full border border-gray-300 rounded p-2.5 text-sm"
                                value={validUntil}
                                onChange={e => setValidUntil(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Rules Section */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-xs font-bold text-gray-500 uppercase">Zasady rabatowe</h4>
                            <button
                                onClick={addRule}
                                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                            >
                                <Plus className="w-3 h-3" />
                                Dodaj zasadę
                            </button>
                        </div>

                        <div className="space-y-4">
                            {rules.map((rule, index) => (
                                <RuleEditor
                                    key={index}
                                    rule={rule}
                                    index={index}
                                    total={rules.length}
                                    modelOptions={modelOptions}
                                    bodyGroupOptions={bodyGroupOptions}
                                    onUpdate={(partial) => updateRule(index, partial)}
                                    onRemove={() => removeRule(index)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-8 pt-4 border-t border-gray-100">
                    <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded">
                        Anuluj
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-6 py-2.5 text-sm bg-black text-white hover:bg-gray-800 rounded disabled:opacity-50"
                    >
                        {saving ? 'Zapisywanie...' : (bulletin ? 'Zapisz zmiany' : 'Utwórz biuletyn')}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Single Rule Editor ──────────────────────────────────────────────────────

function RuleEditor({
    rule,
    index,
    total,
    modelOptions,
    bodyGroupOptions,
    onUpdate,
    onRemove,
}: {
    rule: BulletinRule;
    index: number;
    total: number;
    modelOptions: AutocompleteOption[];
    bodyGroupOptions: AutocompleteOption[];
    onUpdate: (partial: Partial<BulletinRule>) => void;
    onRemove: () => void;
}) {
    return (
        <div className="border border-gray-200 rounded-sm p-4 bg-gray-50 relative">
            <div className="flex justify-between items-center mb-3">
                <h5 className="text-xs font-bold text-gray-500 uppercase">
                    Zasada {index + 1}
                </h5>
                {total > 1 && (
                    <button
                        onClick={onRemove}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                    >
                        <Trash2 className="w-3 h-3" />
                        Usuń
                    </button>
                )}
            </div>

            {/* Targeting */}
            <div className="space-y-3 mb-4">
                {/* Model Codes */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Kody modelu
                    </label>
                    <SearchableSelect
                        options={modelOptions}
                        selected={rule.model_codes || []}
                        onSelect={(code) => onUpdate({ model_codes: [...(rule.model_codes || []), code] })}
                        onRemove={(code) => onUpdate({ model_codes: (rule.model_codes || []).filter(c => c !== code) })}
                        placeholder="Szukaj po nazwie lub kodzie (np. M5, 81FK)..."
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Puste = dotyczy wszystkich modeli</p>
                </div>

                {/* Body Groups */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Seria nadwoziowa
                    </label>
                    <SearchableSelect
                        options={bodyGroupOptions}
                        selected={rule.body_groups || []}
                        onSelect={(bg) => onUpdate({ body_groups: [...(rule.body_groups || []), bg] })}
                        onRemove={(bg) => onUpdate({ body_groups: (rule.body_groups || []).filter(g => g !== bg) })}
                        placeholder="Szukaj serii (np. G60, G90)..."
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Puste = dotyczy wszystkich serii</p>
                </div>

                {/* Production Year Range */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Rok produkcji</label>
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="number"
                            className="w-full border border-gray-300 rounded p-2 text-sm"
                            placeholder="Od (np. 2025)"
                            value={rule.production_year_min || ''}
                            onChange={e => onUpdate({ production_year_min: e.target.value ? parseInt(e.target.value) : undefined })}
                        />
                        <input
                            type="number"
                            className="w-full border border-gray-300 rounded p-2 text-sm"
                            placeholder="Do (np. 2026)"
                            value={rule.production_year_max || ''}
                            onChange={e => onUpdate({ production_year_max: e.target.value ? parseInt(e.target.value) : undefined })}
                        />
                    </div>
                </div>
            </div>

            {/* Discount */}
            <div className="border-t border-gray-200 pt-3">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Wartość rabatu</label>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[11px] text-gray-500 mb-0.5">Rabat procentowy (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            className="w-full border border-gray-300 rounded p-2 text-sm"
                            placeholder="0"
                            value={rule.discount_percent || ''}
                            onChange={e => onUpdate({ discount_percent: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] text-gray-500 mb-0.5">Rabat kwotowy (PLN)</label>
                        <input
                            type="number"
                            step="100"
                            min="0"
                            className="w-full border border-gray-300 rounded p-2 text-sm"
                            placeholder="0"
                            value={rule.discount_amount || ''}
                            onChange={e => onUpdate({ discount_amount: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Procent od ceny katalogowej, następnie kwota. Wynik zaokrąglony do 1 000 PLN w górę.</p>
            </div>
        </div>
    );
}
