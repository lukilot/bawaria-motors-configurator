
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

        // Determine file type
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
            return NextResponse.json({ error: 'Invalid file type. Only images and videos are allowed.' }, { status: 400 });
        }

        let uploadBuffer = buffer;
        let contentType = file.type;
        let filename = `intro-media/${timestamp}-${randomString}.${file.name.split('.').pop()?.toLowerCase() || ''}`;

        // Optimize Images (Clone of StockUploader Logic with robust fallback)
        if (isImage) {
            try {
                // Try to optimize
                const processed = await sharp(buffer)
                    .resize(1920, 1080, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .webp({ quality: 80 })
                    .toBuffer();

                // Explicit serialization to Buffer to avoid Vercel build errors
                uploadBuffer = Buffer.from(processed);

                contentType = 'image/webp';
                filename = `intro-media/${timestamp}-${randomString}.webp`;
            } catch (sharpError) {
                console.warn('Sharp optimization failed, falling back to original file:', sharpError);
                // Fallback: keep uploadBuffer as original buffer, contentType as original type
                // filename remains original extension
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
        console.error('Upload Intro Error CRITICAL:', error);
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
        return NextResponse.json({
            error: error.message || 'Upload failed',
            details: error.toString()
        }, { status: 500 });
    }
}
