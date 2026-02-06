'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, Loader2, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface DictionaryImageUploaderProps {
    currentImage?: string;
    onUploadComplete: (url: string) => void;
    dictionaryType: string;
    code: string;
}

export function DictionaryImageUploader({ currentImage, onUploadComplete, dictionaryType, code }: DictionaryImageUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [dragActive, setDragActive] = useState(false);

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        setIsUploading(true);

        // precise filename creation
        const fileExt = file.name.split('.').pop();
        const fileName = `${dictionaryType}/${code}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', dictionaryType);
            formData.append('code', code);

            const res = await fetch('/api/admin/dictionary/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Upload failed');
            }

            const data = await res.json();

            // Success
            setPreview(data.url);
            onUploadComplete(data.url);
        } catch (error: any) {
            console.error('Error uploading image:', error);
            alert('Error uploading image: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex items-center gap-4">
            {preview ? (
                <div className="relative group w-16 h-16 bg-gray-100 rounded-sm overflow-hidden flex-shrink-0 border border-gray-200">
                    <Image
                        src={preview}
                        alt="Preview"
                        fill
                        className="object-cover"
                    />
                    <button
                        onClick={() => {
                            setPreview(null);
                            onUploadComplete(''); // Clear it
                        }}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                        type="button"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div
                    className={cn(
                        "w-16 h-16 rounded-sm border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-black transition-colors relative",
                        isUploading && "opacity-50 pointer-events-none"
                    )}
                >
                    <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />
                    {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                        <Upload className="w-4 h-4 text-gray-400" />
                    )}
                </div>
            )}
        </div>
    );
}
