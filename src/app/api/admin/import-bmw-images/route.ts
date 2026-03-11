import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ---------------------------------------------------------------
// POV ordering for BOTH BMW configurator formats
// ---------------------------------------------------------------

// NEW FORMAT (stage-fullscreen-views) - named POVs
// First = FRONTRIGHT (main/thumbnail — front + left body visible), Last = INTERIORSIDE (full cabin side view)
const NEW_FORMAT_ORDER = [
    'FRONTRIGHT',    // main photo — front + left side visible (camera right of car)
    'HEROFRONT',
    'FRONTLEFT',
    'TOPRIGHT',
    'SIDERIGHT',
    'WHEEL',
    'HEROREAR',
    'TOPLEFT',
    'REARLEFT',
    'SIDELEFT',
    'DASHBOARD',
    'INTERIOR',
    'FRONTSEATS',
    'REARSEATS',
    'INTERIORSIDE', // MUST be last — full cabin side view
];

// OLD FORMAT (stage-fullscreen-views-legacy) - angle-based WALKAROUND
// First = ANGLE=40 (front-left quarter), Last = DRIVERDOOR
type OldFormatAngle = { pov: string; angle?: number; priority: number };
const OLD_FORMAT_ORDER: OldFormatAngle[] = [
    { pov: 'WALKAROUND', angle: 40,  priority: 1 }, // main
    { pov: 'WALKAROUND', angle: 0,   priority: 2 },
    { pov: 'WALKAROUND', angle: 340, priority: 3 },
    { pov: 'WALKAROUND', angle: 270, priority: 4 },
    { pov: 'WALKAROUND', angle: 271, priority: 5 },
    { pov: 'WALKAROUND', angle: 180, priority: 6 },
    { pov: 'WALKAROUND', angle: 150, priority: 7 },
    { pov: 'WALKAROUND', angle: 90,  priority: 8 },
    { pov: 'DASHBOARD',  priority: 9 }, // cockpit
    { pov: 'DRIVERDOOR', priority: 10 }, // last — interior side view
];

// ---------------------------------------------------------------

async function fetchAndCompress(url: string): Promise<Buffer> {
    const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BawariaBot/1.0)' }
    });
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status} ${url}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const compressed = await sharp(buffer)
        .resize(1920, 1280, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

    return compressed;
}

async function uploadToSupabase(buffer: Buffer, groupId: string, index: number): Promise<string> {
    const filename = `groups/${groupId}/bmw-${index}-${Date.now()}.webp`;
    const { error } = await supabase.storage
        .from('stock-images')
        .upload(filename, buffer, {
            contentType: 'image/webp',
            upsert: true,
        });
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('stock-images')
        .getPublicUrl(filename);

    return publicUrl;
}

export async function POST(request: NextRequest) {
    let browser: any = null;
    try {
        const { groupId, configId, overwrite } = await request.json();
        if (!groupId || !configId) {
            return NextResponse.json({ error: 'Missing groupId or configId' }, { status: 400 });
        }

        const cleanConfigId = configId.trim().replace(/[^a-zA-Z0-9]/g, '');

        // Launch Puppeteer
        const puppeteer = await import('puppeteer');
        browser = await puppeteer.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });

        const page = await browser.newPage();

        let imageData: any[] = [];
        let formatType: 'new' | 'old' | null = null;

        // Intercept network responses to capture the image API
        page.on('response', async (response: any) => {
            const url = response.url();
            if (url.includes('dynamic-named-images') && url.includes('stage-fullscreen-views')) {
                try {
                    const json = await response.json();
                    if (url.includes('stage-fullscreen-views-legacy')) {
                        // Old format
                        const desktop = json?.['stage-fullscreen-views-legacy']?.desktop;
                        const imgs = desktop?.namedImages?.[0]?.images || [];
                        if (imgs.length > 0 && formatType !== 'new') {
                            formatType = 'old';
                            imageData = imgs;
                        }
                    } else {
                        // New format (stage-fullscreen-views)
                        const desktop = json?.['stage-fullscreen-views']?.desktop;
                        const imgs = desktop?.namedImages?.[0]?.images || [];
                        if (imgs.length > 0) {
                            formatType = 'new';
                            imageData = imgs;
                        }
                    }
                } catch {
                    // ignore parse errors
                }
            }
        });

        await page.goto(`https://configure.bmw.pl/pl_PL/configid/${cleanConfigId}`, {
            waitUntil: 'networkidle2',
            timeout: 45000,
        });

        // Wait a bit more for lazy API calls
        await new Promise(r => setTimeout(r, 3000));
        await browser.close();
        browser = null;

        if (!imageData.length || !formatType) {
            return NextResponse.json({ error: 'No images found. Check the configId and try again.' }, { status: 404 });
        }

        // Sort images by the desired order
        let orderedImages: { url: string; pov: string }[] = [];

        if (formatType === 'new') {
            const imageMap = new Map<string, string>();
            for (const img of imageData) {
                const pov = img.distinctionParameters?.POV as string;
                if (pov && !imageMap.has(pov)) {
                    imageMap.set(pov, img.viewImage);
                }
            }
            for (const pov of NEW_FORMAT_ORDER) {
                const url = imageMap.get(pov);
                if (url) orderedImages.push({ url, pov });
            }
        } else {
            // Old format - sort by angle priority
            const sorted = [...imageData].sort((a, b) => {
                const pa = a.distinctionParameters;
                const pb = b.distinctionParameters;
                const getPri = (p: any): number => {
                    if (!p) return 999;
                    const angleRaw = p.ANGLE ? parseFloat(p.ANGLE) : undefined;
                    const pov = p.POV?.toUpperCase();
                    const match = OLD_FORMAT_ORDER.find(o => {
                        if (o.pov === 'WALKAROUND' && o.angle !== undefined) {
                            return pov === 'WALKAROUND' && Math.abs((angleRaw ?? -1) - o.angle) < 1;
                        }
                        return pov === o.pov;
                    });
                    return match?.priority ?? 998;
                };
                return getPri(pa) - getPri(pb);
            });

            const seen = new Set<string | number>();
            for (const img of sorted) {
                const p = img.distinctionParameters;
                const angleRaw = p?.ANGLE ? parseFloat(p.ANGLE) : -1;
                const pov = p?.POV?.toUpperCase();
                const key: string | number = pov === 'WALKAROUND' ? angleRaw : (pov ?? 'UNKNOWN');
                if (!seen.has(key)) {
                    seen.add(key);
                    orderedImages.push({
                        url: img.viewImage,
                        pov: pov === 'WALKAROUND' ? `WALKAROUND_${angleRaw}` : (pov || 'UNKNOWN'),
                    });
                }
            }
        }

        if (orderedImages.length === 0) {
            return NextResponse.json({ error: 'Could not order images. Try again.' }, { status: 500 });
        }

        // Fetch current images (to optionally keep them)
        const { data: groupData, error: groupFetchError } = await supabase
            .from('product_groups')
            .select('images')
            .eq('id', groupId)
            .single();
        if (groupFetchError) throw groupFetchError;

        const existingImages = (!overwrite && groupData?.images) ? groupData.images : [];

        // Download, compress, upload all images
        const newImages = [...existingImages];
        const results: { pov: string; url: string }[] = [];

        for (let i = 0; i < orderedImages.length; i++) {
            const { url: srcUrl, pov } = orderedImages[i];
            try {
                const compressed = await fetchAndCompress(srcUrl);
                const finalUrl = await uploadToSupabase(compressed, groupId, existingImages.length + i);
                newImages.push({
                    id: crypto.randomUUID(),
                    url: finalUrl,
                    sort_order: existingImages.length + i,
                });
                results.push({ pov, url: finalUrl });
            } catch (e: any) {
                console.warn(`Failed to import image ${pov}:`, e.message);
            }
        }

        // Save to DB
        const { error: updateError } = await supabase
            .from('product_groups')
            .update({ images: newImages })
            .eq('id', groupId);
        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            count: results.length,
            format: formatType,
            images: results,
        });

    } catch (error: any) {
        console.error('BMW import failed:', error);
        if (browser) {
            try { await browser.close(); } catch {}
        }
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
}
