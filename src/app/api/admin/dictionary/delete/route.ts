import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Fallback for build
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        }

        // 1. Get the record to find the image URL
        const { data: record, error: fetchError } = await supabase
            .from('dictionaries')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        if (record.data && record.data.image) {
            // Extract path from URL
            // URL: https://.../storage/v1/object/public/dictionary-assets/type/filename.webp
            const url = record.data.image;
            const pathStart = url.indexOf('dictionary-assets/');
            if (pathStart !== -1) {
                const relativePath = url.substring(pathStart + 'dictionary-assets/'.length);

                // 2. Delete from Storage
                const { error: deleteStorageError } = await supabase.storage
                    .from('dictionary-assets')
                    .remove([relativePath]);

                if (deleteStorageError) console.error('Failed to delete image:', deleteStorageError);
            }
        }

        // 3. Delete Record from DB
        const { error: deleteDbError } = await supabase
            .from('dictionaries')
            .delete()
            .eq('id', id);

        if (deleteDbError) throw deleteDbError;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
