import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/admin/recover-groups
 * Diagnoses orphaned product groups (old groups with images but no linked stock units)
 * vs new empty groups (new signature groups with stock units but no images).
 *
 * POST /api/admin/recover-groups
 * Migrates images + manual_price from old groups to the new groups that contain
 * the same stock units (matched by model_code, color_code, upholstery_code).
 */
export async function GET() {
    // 1. Fetch all product groups with their image counts and linked stock unit counts
    const { data: groups, error } = await supabase
        .from('product_groups')
        .select(`
            id,
            signature,
            model_code,
            color_code,
            upholstery_code,
            images,
            manual_price,
            updated_at,
            stock_units(vin)
        `);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const orphaned = groups?.filter((g: any) => {
        const hasImages = g.images && g.images.length > 0;
        const hasUnits = g.stock_units && g.stock_units.length > 0;
        return hasImages && !hasUnits; // Groups with images but no cars (orphaned after import)
    });

    const empty = groups?.filter((g: any) => {
        const hasImages = g.images && g.images.length > 0;
        const hasUnits = g.stock_units && g.stock_units.length > 0;
        return !hasImages && hasUnits; // Groups with cars but no images (new after import)
    });

    return NextResponse.json({
        total_groups: groups?.length,
        orphaned_groups_with_images: orphaned?.length,
        empty_groups_with_cars: empty?.length,
        orphaned: orphaned?.map((g: any) => ({
            id: g.id,
            model_code: g.model_code,
            color_code: g.color_code,
            upholstery_code: g.upholstery_code,
            images_count: g.images?.length || 0,
            manual_price: g.manual_price
        })),
        sample_empty: empty?.slice(0, 5).map((g: any) => ({
            id: g.id,
            model_code: g.model_code,
            color_code: g.color_code,
            upholstery_code: g.upholstery_code,
            unit_count: g.stock_units?.length || 0
        }))
    });
}

export async function POST() {
    // 1. Fetch all groups with images AND groups with units
    const { data: groups, error } = await supabase
        .from('product_groups')
        .select(`
            id,
            signature,
            model_code,
            color_code,
            upholstery_code,
            images,
            manual_price,
            stock_units(vin)
        `);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Groups with images but no cars = orphaned
    let orphaned = groups?.filter((g: any) =>
        g.images && g.images.length > 0 && (!g.stock_units || g.stock_units.length === 0)
    ) || [];

    // Groups with cars but no images = new empty groups
    let emptyWithCars = groups?.filter((g: any) =>
        (!g.images || g.images.length === 0) && g.stock_units && g.stock_units.length > 0
    ) || [];

    let migrated = 0;
    const details: string[] = [];
    const migratedTargetIds = new Set<string>();

    // PASS 1: Exact match by model_code + color_code + upholstery_code
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
                details.push(`[PASS1] Migrated ${orphan.images?.length || 0} photos (${orphan.model_code} ${orphan.color_code} ${orphan.upholstery_code}) → ${match.id}`);
            }
        }
    }

    // PASS 2: Relaxed match by model_code + color_code only (for orphans still unmatched)
    const matchedOrphanIds = new Set<string>();
    for (const orphan of orphaned) {
        const match = emptyWithCars.find((g: any) =>
            !migratedTargetIds.has(g.id) &&
            g.model_code === orphan.model_code &&
            g.color_code === orphan.color_code
        );

        if (match) {
            const { error: updateError } = await supabase
                .from('product_groups')
                .update({ images: orphan.images, manual_price: orphan.manual_price || match.manual_price })
                .eq('id', match.id);

            if (!updateError) {
                migrated++;
                migratedTargetIds.add(match.id);
                matchedOrphanIds.add(orphan.id);
                details.push(`[PASS2] Migrated ${orphan.images?.length || 0} photos (${orphan.model_code} ${orphan.color_code}) → ${match.id}`);
            }
        }
    }

    // PASS 3: Ultra-relaxed match by model_code only (last resort - same model, any color)
    for (const orphan of orphaned) {
        if (matchedOrphanIds.has(orphan.id)) continue; // Already matched in pass 2

        const match = emptyWithCars.find((g: any) =>
            !migratedTargetIds.has(g.id) &&
            g.model_code === orphan.model_code
        );

        if (match) {
            const { error: updateError } = await supabase
                .from('product_groups')
                .update({ images: orphan.images, manual_price: orphan.manual_price || match.manual_price })
                .eq('id', match.id);

            if (!updateError) {
                migrated++;
                migratedTargetIds.add(match.id);
                details.push(`[PASS3-RELAXED] Migrated ${orphan.images?.length || 0} photos (${orphan.model_code} → different color) → ${match.id}`);
            }
        }
    }

    return NextResponse.json({
        success: true,
        orphaned_found: orphaned.length,
        empty_found: emptyWithCars.length,
        migrated,
        details
    });
}
