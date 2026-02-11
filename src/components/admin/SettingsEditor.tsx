'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Upload, X } from 'lucide-react';
import { compressImage } from '@/lib/image-utils';

interface Settings {
    intro_media_url: string;
    intro_media_url_mobile: string;
    intro_cta_link: string;
    intro_contact_phone: string;
}

export function SettingsEditor() {
    const [settings, setSettings] = useState<Settings>({
        intro_media_url: '',
        intro_media_url_mobile: '',
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'desktop' | 'mobile') => {
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
                [type === 'desktop' ? 'intro_media_url' : 'intro_media_url_mobile']: url
            }));
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
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">
                        Intro Media (Desktop)
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
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'desktop')} accept="image/*,video/*" />
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
                                onClick={() => setSettings({ ...settings, intro_media_url: '' })}
                                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm"
                            >
                                <X className="w-3 h-3 text-red-500" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobile Media URL */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">
                        Intro Media (Mobile)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={settings.intro_media_url_mobile}
                            onChange={(e) => setSettings({ ...settings, intro_media_url_mobile: e.target.value })}
                            className="flex-1 p-2 border border-gray-200 rounded-sm text-sm"
                            placeholder="https://..."
                        />
                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-sm flex items-center justify-center transition-colors">
                            <Upload className="w-4 h-4" />
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'mobile')} accept="image/*,video/*" />
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
                                onClick={() => setSettings({ ...settings, intro_media_url_mobile: '' })}
                                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm"
                            >
                                <X className="w-3 h-3 text-red-500" />
                            </button>
                        </div>
                    )}
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
