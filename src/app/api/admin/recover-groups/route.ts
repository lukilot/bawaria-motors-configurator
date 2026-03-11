import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function extractGroupIdFromUrl(url: string): string | null {
    const match = url.match(/groups\/([a-f0-9-]{36})\//);
    return match ? match[1] : null;
}

export async function GET() {
    try {
        // Fetch groups metadata (no nested stock_units to avoid timeout)
        const { data: groups, error } = await supabase
            .from('product_groups')
            .select('id, model_code, color_code, upholstery_code, images, manual_price');
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Fetch which group_ids have at least one stock_unit
        const { data: activeGroupIds, error: activeError } = await supabase
            .from('stock_units')
            .select('product_group_id')
            .not('product_group_id', 'is', null)
            .lt('status_code', 500);
        if (activeError) return NextResponse.json({ error: activeError.message }, { status: 500 });

        const activeSet = new Set(activeGroupIds?.map((r: any) => r.product_group_id) || []);

        const groupMeta = new Map<string, any>();
        groups?.forEach((g: any) => groupMeta.set(g.id, g));

        const orphaned = groups?.filter((g: any) => g.images?.length > 0 && !activeSet.has(g.id)) || [];
        const emptyWithCars = groups?.filter((g: any) => (!g.images || g.images.length === 0) && activeSet.has(g.id)) || [];
        const activeWithImages = groups?.filter((g: any) => g.images?.length > 0 && activeSet.has(g.id)) || [];

        // Detect color mismatches
        const mismatches: any[] = [];
        for (const group of activeWithImages) {
            const origId = extractGroupIdFromUrl(group.images[0]);
            if (!origId || origId === group.id) continue;
            const orig = groupMeta.get(origId);
            if (!orig) continue;
            if (orig.color_code !== group.color_code) {
                mismatches.push({
                    group_id: group.id,
                    model_code: group.model_code,
                    current_color: group.color_code,
                    photo_source_color: orig.color_code,
                    current_upholstery: group.upholstery_code,
                    photo_source_upholstery: orig.upholstery_code,
                });
            }
        }

        return NextResponse.json({
            total_groups: groups?.length || 0,
            orphaned_groups_with_images: orphaned.length,
            empty_groups_with_cars: emptyWithCars.length,
            active_with_color_mismatches: mismatches.length,
            sample_mismatches: mismatches.slice(0, 10),
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'reassign-exact';

        const { data: groups, error } = await supabase
            .from('product_groups')
            .select('id, model_code, color_code, upholstery_code, images, manual_price');
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        const { data: activeGroupIds, error: activeError } = await supabase
            .from('stock_units')
            .select('product_group_id')
            .not('product_group_id', 'is', null)
            .lt('status_code', 500);
        if (activeError) return NextResponse.json({ error: activeError.message }, { status: 500 });

        const activeSet = new Set(activeGroupIds?.map((r: any) => r.product_group_id) || []);
        const groupMeta = new Map<string, any>();
        groups?.forEach((g: any) => groupMeta.set(g.id, g));

        if (action === 'clear-mismatches') {
            const activeWithImages = groups?.filter((g: any) => g.images?.length > 0 && activeSet.has(g.id)) || [];
            let cleared = 0;
            const details: string[] = [];

            for (const group of activeWithImages) {
                const origId = extractGroupIdFromUrl(group.images[0]);
                if (!origId || origId === group.id) continue;
                const orig = groupMeta.get(origId);
                if (!orig) continue;

                if (orig.color_code !== group.color_code) {
                    const { error: updateError } = await supabase
                        .from('product_groups')
                        .update({ images: null })
                        .eq('id', group.id);
                    if (!updateError) {
                        cleared++;
                        details.push(`Cleared: ${group.model_code} ${group.color_code} (had photos from ${orig.color_code})`);
                    }
                }
            }

            return NextResponse.json({ success: true, action: 'clear-mismatches', cleared, details: details.slice(0, 30) });
        }

        // Default: reassign-exact - only exact match (model + color + upholstery)
        const orphaned = groups?.filter((g: any) => g.images?.length > 0 && !activeSet.has(g.id)) || [];
        const emptyWithCars = groups?.filter((g: any) => (!g.images || g.images.length === 0) && activeSet.has(g.id)) || [];

        let migrated = 0;
        const details: string[] = [];
        const migratedTargetIds = new Set<string>();

        for (const orphan of orphaned) {
            const match = emptyWithCars.find((g: any) =>
                !migratedTargetIds.has(g.id) &&
                g.model_code === orphan.model_code &&
                g.color_code === orphan.color_code &&
                g.upholstery_code === orphan.upholstery_code
            );
            if (match) {
                const { error: updateError } = await supabase
                    .from('product_groups')
                    .update({ images: orphan.images, manual_price: orphan.manual_price || match.manual_price })
                    .eq('id', match.id);
                if (!updateError) {
                    migrated++;
                    migratedTargetIds.add(match.id);
                    details.push(`Migrated: ${orphan.model_code} ${orphan.color_code} ${orphan.upholstery_code}`);
                }
            }
        }

        return NextResponse.json({ success: true, action: 'reassign-exact', orphaned_found: orphaned.length, empty_found: emptyWithCars.length, migrated, details: details.slice(0, 30) });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
