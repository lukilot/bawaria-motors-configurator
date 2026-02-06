import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

// Initialize Supabase Admin Client (needed for Service Role to bypass potential RLS if needed, though Anon should work if bucket is public)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const vin = formData.get('vin') as string;

        if (!file || !vin) {
            return NextResponse.json({ error: 'Missing file or VIN' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Optimize with Sharp
        const optimizedBuffer = await sharp(buffer)
            .resize(1920, 1080, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toBuffer();

        // Generate filename
        const filename = `${vin}/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;

        // Upload to Supabase
        const { data, error } = await supabase.storage
            .from('car-images') // Use the correct bucket name! Script used 'car-images', frontend used 'stock-images'. Need to verify which one to use.
            .upload(filename, optimizedBuffer, {
                contentType: 'image/webp',
                upsert: true
            });

        if (error) throw error;

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('car-images')
            .getPublicUrl(filename);

        return NextResponse.json({ url: publicUrl });

    } catch (error: any) {
        console.error('Upload failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
