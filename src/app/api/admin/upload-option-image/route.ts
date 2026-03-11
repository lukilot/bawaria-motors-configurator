import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const bodyGroup = formData.get('bodyGroup') as string;
        const code = formData.get('code') as string;

        if (!file || !bodyGroup || !code) {
            return NextResponse.json({ error: 'Missing file, bodyGroup or code' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Process image with Sharp: resize, contain, background white (if needed), compress to WebP
        const processedBuffer = await sharp(buffer)
            .resize(400, 400, { 
                fit: 'contain', 
                background: { r: 255, g: 255, b: 255, alpha: 0 } 
            })
            .webp({ quality: 82 })
            .toBuffer();

        const filename = `options/${bodyGroup}/${code}_manual_${Date.now()}.webp`;
        
        const { error: uploadError } = await supabase.storage
            .from('stock-images')
            .upload(filename, processedBuffer, { 
                contentType: 'image/webp', 
                upsert: true 
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('stock-images').getPublicUrl(filename);

        return NextResponse.json({ success: true, publicUrl });
    } catch (error: any) {
        console.error('Image processing failed:', error);
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}
