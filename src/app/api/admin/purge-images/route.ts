import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
    try {
        const { vin } = await request.json();

        if (!vin) {
            return NextResponse.json({ error: 'Missing VIN' }, { status: 400 });
        }

        // 1. Check if ANY images exist in the folder (list files)
        const { data: list, error: listError } = await supabase.storage
            .from('stock-images')
            .list(vin);

        if (listError) throw listError;

        // 2. Delete found files
        if (list && list.length > 0) {
            const filesToRemove = list.map(x => `${vin}/${x.name}`);
            const { error: removeError } = await supabase.storage
                .from('stock-images')
                .remove(filesToRemove);

            if (removeError) throw removeError;
        }

        // 3. Clear images column in DB
        const { error: dbError } = await supabase
            .from('stock_units')
            .update({ images: [] })
            .eq('vin', vin);

        if (dbError) throw dbError;

        return NextResponse.json({ success: true, count: list?.length || 0 });

    } catch (error: any) {
        console.error('Purge failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
