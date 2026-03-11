import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // 1. Fetch all options
        const { data: options, error: optError } = await supabase
            .from('dictionaries')
            .select('code, data')
            .eq('type', 'option');

        if (optError) throw optError;

        // 2. Fetch all colors and upholstery
        const { data: mappings, error: mapError } = await supabase
            .from('dictionaries')
            .select('type, code, data')
            .in('type', ['color', 'upholstery']);

        if (mapError) throw mapError;

        // Create a lookup for existing mappings (items with a group assigned)
        const mappedCodes = new Set(
            mappings
                .filter(m => m.data?.group)
                .map(m => `${m.type}:${m.code}`)
        );

        const unmapped: any[] = [];

        for (const opt of options) {
            const code = opt.code;
            const name = opt.data?.name || '';
            
            // Heuristic for Color detection:
            // - 3 digits (e.g. 300, 475)
            // - C/P prefix + 2 digits/chars (C31, P5T)
            // - Mention of "Lakier" in data? (Optional if not available)
            const isColor = /^[0-9]{3}$/.test(code) || /^[CP][A-Z0-9]{2,3}$/.test(code);
            
            // Heuristic for Upholstery detection:
            // - 4 chars (FKCU, KPSW)
            // - Specialized prefixes if known
            const isUpholstery = /^[A-Z0-9]{4}$/.test(code) && !isColor;

            if (isColor) {
                if (!mappedCodes.has(`color:${code}`)) {
                    unmapped.push({ type: 'color', code, name, source: 'option' });
                }
            } else if (isUpholstery) {
                if (!mappedCodes.has(`upholstery:${code}`)) {
                    unmapped.push({ type: 'upholstery', code, name, source: 'option' });
                }
            }
        }

        // Deduplicate by code (options can have multiple entries for different models)
        const uniqueUnmapped = Array.from(new Map(unmapped.map(item => [`${item.type}:${item.code}`, item])).values());

        return NextResponse.json({ unmapped: uniqueUnmapped });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { type, code, name, group } = await req.json();

        if (!type || !code || !group) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if mapping exists
        const { data: existing } = await supabase
            .from('dictionaries')
            .select('id, data')
            .eq('type', type)
            .eq('code', code)
            .single();

        if (existing) {
            const { error } = await supabase
                .from('dictionaries')
                .update({ 
                    data: { ...existing.data, group, name: name || existing.data.name } 
                })
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('dictionaries')
                .insert({
                    type,
                    code,
                    data: { name, group }
                });
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
