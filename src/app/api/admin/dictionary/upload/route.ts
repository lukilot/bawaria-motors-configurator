import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as string;
        const code = formData.get('code') as string;

        if (!file || !type || !code) {
            return NextResponse.json({ error: 'Missing file, type, or code' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // 1. Optimize Image (Resize to max 1200px width, WebP, 80% quality)
        const optimizedBuffer = await sharp(buffer)
            .resize(800, null, { withoutEnlargement: true }) // Dictionary items are usually smaller (thumbnails or swatches)
            .webp({ quality: 85 })
            .toBuffer();

        // 2. Upload to Supabase Storage
        // Path: {type}/{code}-{timestamp}.webp
        const timestamp = Date.now();
        const path = `${type}/${code}-${timestamp}.webp`;

        const { data, error } = await supabase.storage
            .from('dictionary-assets')
            .upload(path, optimizedBuffer, {
                contentType: 'image/webp',
                upsert: true
            });

        if (error) throw error;

        // 3. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('dictionary-assets')
            .getPublicUrl(path);

        return NextResponse.json({ url: publicUrl });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
