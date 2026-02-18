import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const dictType = searchParams.get('dict');

    // If requesting model dictionary for autocomplete
    if (dictType === 'model') {
        const { data, error } = await supabase
            .from('dictionaries')
            .select('code, data')
            .eq('type', 'model');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform to flat array: { code, name, body_group }
        const models = (data || []).map((item: any) => ({
            code: item.code,
            name: item.data?.name || item.code,
            body_group: item.data?.group || item.data?.body_group || undefined,
        }));

        return NextResponse.json(models);
    }

    // If requesting body groups from stock
    if (dictType === 'bodygroups') {
        const { data, error } = await supabase
            .from('stock_units')
            .select('body_group');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Extract unique non-empty body_group values
        const groups = [...new Set(
            (data || [])
                .map((item: any) => item.body_group)
                .filter((bg: any) => bg && typeof bg === 'string' && bg.trim() !== '')
        )].sort();

        return NextResponse.json(groups);
    }

    // Default: return bulletins
    const { data, error } = await supabase
        .from('bulletins')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
    const body = await req.json();

    const { data, error } = await supabase
        .from('bulletins')
        .insert({
            name: body.name,
            description: body.description || null,
            rules: body.rules || [],
            is_active: body.is_active ?? true,
            valid_from: body.valid_from || null,
            valid_until: body.valid_until || null,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
    const body = await req.json();

    if (!body.id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.rules !== undefined) updateData.rules = body.rules;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.valid_from !== undefined) updateData.valid_from = body.valid_from || null;
    if (body.valid_until !== undefined) updateData.valid_until = body.valid_until || null;

    const { data, error } = await supabase
        .from('bulletins')
        .update(updateData)
        .eq('id', body.id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const { error } = await supabase
        .from('bulletins')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
