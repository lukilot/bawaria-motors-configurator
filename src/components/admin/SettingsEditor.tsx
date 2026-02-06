'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Upload, X } from 'lucide-react';

interface Settings {
    intro_media_url: string;
    intro_cta_link: string;
    intro_contact_phone: string;
}

export function SettingsEditor() {
    const [settings, setSettings] = useState<Settings>({
        intro_media_url: '',
        intro_cta_link: '',
        intro_contact_phone: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

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

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = Object.entries(settings).map(([key, value]) => ({
                key,
                value
            }));

            const { error } = await supabase.from('site_settings').upsert(updates, { onConflict: 'key' });
            if (error) throw error;

            alert('Settings saved!');
        } catch (err) {
            console.error('Error saving settings:', err);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `intro-${Date.now()}.${fileExt}`;
            const filePath = `intro-media/${fileName}`;

            // Upload to 'stock-images' bucket (or a dedicated 'assets' bucket if we had one, reusing stock-images for simplicity)
            const { error: uploadError } = await supabase.storage
                .from('stock-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('stock-images')
                .getPublicUrl(filePath);

            setSettings(prev => ({ ...prev, intro_media_url: publicUrl }));
        } catch (err) {
            console.error('Error uploading file:', err);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-6">Konfiguracja Intro / Intro Settings</h2>

            <div className="space-y-6">
                {/* Media URL */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">
                        Intro Media (Image/Video URL)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={settings.intro_media_url}
                            onChange={(e) => setSettings({ ...settings, intro_media_url: e.target.value })}
                            className="flex-1 p-2 border border-gray-200 rounded-sm text-sm"
                            placeholder="https://..."
                        />
                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-sm flex items-center justify-center transition-colors">
                            <Upload className="w-4 h-4" />
                            <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,video/*" />
                        </label>
                    </div>
                    {settings.intro_media_url && (
                        <div className="mt-2 relative w-32 h-20 bg-gray-100 rounded overflow-hidden">
                            {/* Simple preview if image */}
                            <img src={settings.intro_media_url} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                onClick={() => setSettings({ ...settings, intro_media_url: '' })}
                                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm"
                            >
                                <X className="w-3 h-3 text-red-500" />
                            </button>
                        </div>
                    )}
                </div>

                {/* CTA Link */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">
                        Featured Car Link (CTA URL)
                    </label>
                    <input
                        type="text"
                        value={settings.intro_cta_link}
                        onChange={(e) => setSettings({ ...settings, intro_cta_link: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-sm text-sm"
                        placeholder="/cars/WB..."
                    />
                    <p className="text-[10px] text-gray-400">Leave empty to use default logic (most expensive car).</p>
                </div>

                {/* Contact Phone */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">
                        Contact Phone
                    </label>
                    <input
                        type="text"
                        value={settings.intro_contact_phone}
                        onChange={(e) => setSettings({ ...settings, intro_contact_phone: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-sm text-sm"
                        placeholder="+48 000 000 000"
                    />
                </div>

                <div className="pt-6 border-t border-gray-100">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-black text-white px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                        {saving ? 'Saving...' : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
