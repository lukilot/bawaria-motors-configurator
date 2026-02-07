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

        if (!file) {
            return NextResponse.json({ error: 'Missing file' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        let uploadBuffer: Buffer = buffer;
        let contentType = file.type;
        let extension = file.name.split('.').pop()?.toLowerCase() || '';
        let filename = `intro-media/${timestamp}-${randomString}.${extension}`;

        // Optimize Images
        if (file.type.startsWith('image/')) {
            try {
                const processed = await sharp(buffer)
                    .resize(1920, 1080, {
                        fit: 'inside', // Proportional resize, max dimensions
                        withoutEnlargement: true
                    })
                    .webp({ quality: 80 })
                    .toBuffer();

                uploadBuffer = processed as unknown as Buffer;

                contentType = 'image/webp';
                filename = `intro-media/${timestamp}-${randomString}.webp`;
            } catch (sharpError) {
                console.warn('Sharp optimization failed, falling back to original:', sharpError);
                // Fallback to original buffer/type if sharp fails
            }
        }

        // Upload to Supabase
        const { data, error } = await supabase.storage
            .from('stock-images')
            .upload(filename, uploadBuffer, {
                contentType: contentType,
                upsert: true
            });

        if (error) throw error;

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('stock-images')
            .getPublicUrl(filename);

        return NextResponse.json({ url: publicUrl });

    } catch (error: any) {
        console.error('Upload failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
