'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Upload, X } from 'lucide-react';
import { compressImage } from '@/lib/image-utils';
import { useAdminStore } from '@/store/adminStore';

interface Settings {
    intro_media_url: string;
    intro_media_url_mobile: string;
    intro_cta_link: string;
    intro_contact_phone: string;
    
    // Hero Settings
    hero_title_line1: string;
    hero_title_line2: string;
    hero_car_name: string;
    hero_description: string;
    hero_button_text: string;
    hero_button_link: string;
    hero_stats_power: string;
    hero_stats_status: string;
    hero_color_badge: string;
    hero_image_url: string;
}

export function SettingsEditor() {
    const [settings, setSettings] = useState<Settings>({
        intro_media_url: '',
        intro_media_url_mobile: '',
        intro_cta_link: '',
        intro_contact_phone: '',
        hero_title_line1: '',
        hero_title_line2: '',
        hero_car_name: '',
        hero_description: '',
        hero_button_text: '',
        hero_button_link: '',
        hero_stats_power: '',
        hero_stats_status: '',
        hero_color_badge: '',
        hero_image_url: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { setDirty, setOnSave } = useAdminStore();
    // Use a ref so we can always call the latest version of handleSave
    // without re-registering with setOnSave on every state change.
    const handleSaveRef = useRef<(() => Promise<void>) | undefined>(undefined);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const { data, error } = await supabase.from('site_settings').select('key, value');
            if (error) throw error;

            const newSettings: any = {};
            data?.forEach(item => {
                newSettings[item.key] = item.value;
            });

            setSettings(prev => ({ ...prev, ...newSettings }));
        } catch (err) {
            console.error('Error loading settings:', err);
        } finally {
            setLoading(false);
        }
    };

    // Remove old ref-based effect that didn't sync updates back correctly. 
    // Instead simply watch state and push the save handler explicitly down to store bounds whenever it's active.
    useEffect(() => {
        setOnSave(async () => {
            setSaving(true);
            try {
                const updates = Object.entries(settings).map(([key, value]) => ({
                    key,
                    value
                }));

                const { error } = await supabase.from('site_settings').upsert(updates, { onConflict: 'key' });
                if (error) throw error;

                setDirty(false);
                alert('Settings saved!');
            } catch (err) {
                console.error('Error saving settings:', err);
                alert('Failed to save settings');
            } finally {
                setSaving(false);
            }
        });

        // Cleanup on unmount
        return () => setOnSave(null);
    }, [settings, setDirty, setOnSave]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, settingKey: keyof Settings) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side compression for images to bypass Vercel 4.5MB limit
        let fileToUpload = file;

        if (file.type.startsWith('image/')) {
            try {
                setUploading(true); // Show loading during compression
                fileToUpload = await compressImage(file);
            } catch (compressionError) {
                console.warn('Client-side compression failed, trying original file:', compressionError);
                // Fallback to original file
            }
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', fileToUpload);

            const response = await fetch('/api/admin/upload-intro', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Upload Error Details:', errorData);
                throw new Error(errorData.error || errorData.details || 'Upload failed');
            }

            const { url } = await response.json();

            setSettings(prev => ({
                ...prev,
                [settingKey]: url
            }));
            setDirty(true);
        } catch (err: any) {
            console.error('Error uploading file:', err);
            alert(`Upload failed: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-6">Konfiguracja Intro / Intro Settings</h2>

            <div className="space-y-6">
                {/* Desktop Media URL */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-700">
                        Intro Media (Desktop)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={settings.intro_media_url}
                            onChange={(e) => {
                                setSettings({ ...settings, intro_media_url: e.target.value });
                                setDirty(true);
                            }}
                            className="flex-1 p-2 border border-gray-200 rounded-sm text-sm"
                            placeholder="https://..."
                        />
                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-sm flex items-center justify-center transition-colors">
                            <Upload className="w-4 h-4" />
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'intro_media_url')} accept="image/*,video/*" />
                        </label>
                    </div>
                    {settings.intro_media_url && (
                        <div className="mt-2 relative w-32 h-20 bg-gray-100 rounded overflow-hidden">
                            {settings.intro_media_url.match(/\.(mp4|webm)$/) ? (
                                <video src={settings.intro_media_url} className="w-full h-full object-cover" />
                            ) : (
                                <img src={settings.intro_media_url} alt="Preview" className="w-full h-full object-cover" />
                            )}
                            <button
                                onClick={() => {
                                    setSettings({ ...settings, intro_media_url: '' });
                                    setDirty(true);
                                }}
                                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm"
                            >
                                <X className="w-3 h-3 text-red-500" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobile Media URL */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-700">
                        Intro Media (Mobile)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={settings.intro_media_url_mobile}
                            onChange={(e) => {
                                setSettings({ ...settings, intro_media_url_mobile: e.target.value });
                                setDirty(true);
                            }}
                            className="flex-1 p-2 border border-gray-200 rounded-sm text-sm"
                            placeholder="https://..."
                        />
                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-sm flex items-center justify-center transition-colors">
                            <Upload className="w-4 h-4" />
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'intro_media_url_mobile')} accept="image/*,video/*" />
                        </label>
                    </div>
                    {settings.intro_media_url_mobile && (
                        <div className="mt-2 relative w-20 h-32 bg-gray-100 rounded overflow-hidden">
                            {settings.intro_media_url_mobile.match(/\.(mp4|webm)$/) ? (
                                <video src={settings.intro_media_url_mobile} className="w-full h-full object-cover" />
                            ) : (
                                <img src={settings.intro_media_url_mobile} alt="Preview" className="w-full h-full object-cover" />
                            )}
                            <button
                                onClick={() => {
                                    setSettings({ ...settings, intro_media_url_mobile: '' });
                                    setDirty(true);
                                }}
                                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm"
                            >
                                <X className="w-3 h-3 text-red-500" />
                            </button>
                        </div>
                    )}
                </div>



                {/* Contact Phone */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-700">
                        Contact Phone
                    </label>
                    <input
                        type="text"
                        value={settings.intro_contact_phone}
                        onChange={(e) => {
                            setSettings({ ...settings, intro_contact_phone: e.target.value });
                            setDirty(true);
                        }}
                        className="w-full p-2 border border-gray-200 rounded-sm text-sm"
                        placeholder="+48 000 000 000"
                    />
                </div>

            </div>

            <div className="w-full h-px bg-gray-200 my-10" />

            <h2 className="text-xl font-bold mb-6">Sekcja Hero (Strona Główna)</h2>

            <div className="space-y-6">
                
                {/* Hero Tło */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-700">
                        Hero Zdjęcie Tła
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={settings.hero_image_url}
                            onChange={(e) => {
                                setSettings({ ...settings, hero_image_url: e.target.value });
                                setDirty(true);
                            }}
                            className="flex-1 p-2 border border-gray-200 rounded-sm text-sm"
                            placeholder="https://images.unsplash.com/..."
                        />
                        <label className="cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-sm flex items-center justify-center transition-colors font-semibold text-sm">
                            <Upload className="w-4 h-4 mr-2" />
                            Wgraj (Kompresja WebP)
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'hero_image_url')} accept="image/*" />
                        </label>
                    </div>
                    {settings.hero_image_url && (
                        <div className="mt-2 relative w-full h-40 bg-gray-100 rounded overflow-hidden">
                            <img src={settings.hero_image_url} alt="Preview Hero" className="w-full h-full object-cover object-center" />
                            <button
                                onClick={() => {
                                    setSettings({ ...settings, hero_image_url: '' });
                                    setDirty(true);
                                }}
                                className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-red-50"
                            >
                                <X className="w-4 h-4 text-red-500" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Linia Tytułowa 1 */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase">Nagłówek - Linia 1 (Zwykła)</label>
                        <input
                            type="text"
                            value={settings.hero_title_line1}
                            onChange={(e) => { setSettings({ ...settings, hero_title_line1: e.target.value }); setDirty(true); }}
                            className="w-full p-2 border border-gray-200 rounded-sm text-sm"
                            placeholder="Definicja"
                        />
                    </div>

                    {/* Linia Tytułowa 2 */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase">Nagłówek - Linia 2 (Gradient)</label>
                        <input
                            type="text"
                            value={settings.hero_title_line2}
                            onChange={(e) => { setSettings({ ...settings, hero_title_line2: e.target.value }); setDirty(true); }}
                            className="w-full p-2 border border-gray-200 rounded-sm text-sm"
                            placeholder="Premium."
                        />
                    </div>

                    {/* Klasa / Model na karcie */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase">Nazwa na karcie (Model auta)</label>
                        <input
                            type="text"
                            value={settings.hero_car_name}
                            onChange={(e) => { setSettings({ ...settings, hero_car_name: e.target.value }); setDirty(true); }}
                            className="w-full p-2 border border-gray-200 rounded-sm text-sm"
                            placeholder="Nowy BMW M5"
                        />
                    </div>

                    {/* Kolor (Badge Individual) */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase">Nazwa Lakieru (Badge BMW Individual)</label>
                        <input
                            type="text"
                            value={settings.hero_color_badge}
                            onChange={(e) => { setSettings({ ...settings, hero_color_badge: e.target.value }); setDirty(true); }}
                            className="w-full p-2 border border-gray-200 rounded-sm text-sm"
                            placeholder="Frozen Marina Bay Blue"
                        />
                    </div>
                </div>

                {/* Opis na karcie */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase">Opis pod nazwą auta</label>
                    <textarea
                        value={settings.hero_description}
                        onChange={(e) => { setSettings({ ...settings, hero_description: e.target.value }); setDirty(true); }}
                        className="w-full p-2 border border-gray-200 rounded-sm text-sm min-h-[80px]"
                        placeholder="Odkryj esencję sportowej elegancji..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase">Tekst Przycisku CTA</label>
                        <input
                            type="text"
                            value={settings.hero_button_text}
                            onChange={(e) => { setSettings({ ...settings, hero_button_text: e.target.value }); setDirty(true); }}
                            className="w-full p-2 border border-gray-200 rounded-sm text-sm"
                            placeholder="Szczegóły oferty"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase">Odnośnik Przycisku CTA</label>
                        <input
                            type="text"
                            value={settings.hero_button_link}
                            onChange={(e) => { setSettings({ ...settings, hero_button_link: e.target.value }); setDirty(true); }}
                            className="w-full p-2 border border-gray-200 rounded-sm text-sm"
                            placeholder="/cars"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase">Pływająca Statystyka 1 (Moc)</label>
                        <input
                            type="text"
                            value={settings.hero_stats_power}
                            onChange={(e) => { setSettings({ ...settings, hero_stats_power: e.target.value }); setDirty(true); }}
                            className="w-full p-2 border border-gray-200 rounded-sm text-sm"
                            placeholder="600 KM"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase">Pływająca Statystyka 2 (Status)</label>
                        <input
                            type="text"
                            value={settings.hero_stats_status}
                            onChange={(e) => { setSettings({ ...settings, hero_stats_status: e.target.value }); setDirty(true); }}
                            className="w-full p-2 border border-gray-200 rounded-sm text-sm"
                            placeholder="Od ręki"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
