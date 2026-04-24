import { NextRequest, NextResponse } from 'next/server';
import { launchBrowser } from '@/lib/browser-launcher';

// ── Types ─────────────────────────────────────────────────────────────────────
interface CompareCarPayload {
    model_code: string;
    model_name?: string;
    product_group_id?: string;
    vin?: string;
    fuel_type?: string;
    power?: number;
    drivetrain?: string;
    color_code?: string;
    individual_color?: string;
    upholstery_code?: string;
    list_price: number;
    special_price?: number;
    option_codes?: string[];
    images?: { url: string }[];
    group_images?: { url: string }[];
}

interface DictsPayload {
    model: Record<string, { name?: string } | null>;
    option: Record<string, { name?: string } | Array<{ name?: string }> | null>;
    color: Record<string, { name?: string } | null>;
    upholstery: Record<string, { name?: string } | null>;
    drivetrain: Record<string, { name?: string } | null>;
}

interface ComparePdfBody {
    cars: CompareCarPayload[];
    dicts: DictsPayload;
    diffCodes: string[];
    specRows: Array<{ label: string; values: string[] }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPrice(price: number): string {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        maximumFractionDigits: 0,
    }).format(price);
}

function getModelName(dicts: DictsPayload, modelCode: string): string {
    const entry = dicts.model?.[modelCode] as any;
    return entry?.name || `BMW ${modelCode}`;
}

function getOptionName(dicts: DictsPayload, code: string): string {
    if (code === '337') return 'Pakiet sportowy M';
    if (code === '300') return 'Koło zapasowe';
    if (code === '490') return 'Regulacja szerokości oparcia foteli przednich';
    if (code === '430') return 'Pakiet dodatkowych funkcji lusterek';
    const entry = dicts.option?.[code];
    if (!entry) return code;
    const name = Array.isArray(entry) ? entry[0]?.name : (entry as any)?.name;
    return name || code;
}

function getFlattenedCodes(car: CompareCarPayload): string[] {
    const codes = new Set<string>();
    car.option_codes?.forEach((raw: string) => {
        const match = raw.match(/^([A-Z0-9]+)\s*\((.+)\)$/);
        if (match) {
            const kids = match[2].trim().split(/[\s,]+/).filter(Boolean);
            kids.forEach(k => codes.add(k.trim()));
        } else {
            codes.add(raw.trim());
        }
    });
    return Array.from(codes);
}

// ── HTML Template ─────────────────────────────────────────────────────────────
function buildHtml(body: ComparePdfBody): string {
    const { cars, dicts, diffCodes, specRows } = body;
    const n = cars.length;
    const today = new Date().toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

    const carOptionMaps = cars.map(car => {
        const codes = new Set(getFlattenedCodes(car).filter(code => {
            const entry = dicts.option?.[code] as any;
            if (Array.isArray(entry)) return !entry.some((e: any) => e.hidden === true);
            return entry?.hidden !== true;
        }));
        return codes;
    });

    const colWidth = n === 1 ? 60 : n === 2 ? 46 : 32;
    const labelWidth = 100 - n * colWidth;

    // Car header cards
    const carCards = cars.map((car, idx) => {
        const imgUrl = car.images?.[0]?.url || car.group_images?.[0]?.url || '';
        const modelName = getModelName(dicts, car.model_code);
        const price = car.special_price && car.special_price < car.list_price
            ? car.special_price
            : car.list_price;
        const hasDiscount = !!(car.special_price && car.special_price < car.list_price);

        return `
        <div class="car-card">
            <div class="car-img-wrap">
                ${imgUrl
                    ? `<img src="${imgUrl}" alt="${modelName}" class="car-img" />`
                    : `<div class="car-img-placeholder"><span>BMW</span></div>`
                }
                <div class="car-badge">#${idx + 1}</div>
            </div>
            <div class="car-info">
                <div class="car-model">${modelName}</div>
                <div class="car-price-row">
                    ${hasDiscount
                        ? `<span class="car-price-special">${formatPrice(price)}</span><span class="car-price-original">${formatPrice(car.list_price)}</span>`
                        : `<span class="car-price">${formatPrice(price)}</span>`
                    }
                </div>
                ${car.vin ? `<div class="car-vin">VIN: ${car.vin}</div>` : ''}
            </div>
        </div>`;
    }).join('');

    // Spec rows
    const specRowsHtml = specRows.map(row => {
        const isDiff = new Set(row.values).size > 1;
        const cells = row.values.map(v =>
            `<td class="cell val-cell${isDiff ? ' diff-val' : ''}">${v}</td>`
        ).join('');
        return `<tr class="${isDiff ? 'diff-row' : ''}">
            <td class="cell label-cell">${row.label}</td>
            ${cells}
        </tr>`;
    }).join('');

    // Equipment diff rows
    const equipRowsHtml = diffCodes.map(code => {
        const name = getOptionName(dicts, code);
        const cells = cars.map((_, i) => {
            const has = carOptionMaps[i].has(code);
            return `<td class="cell val-cell diff-val check-cell">${has
                ? `<span class="check yes">✓</span>`
                : `<span class="check no">–</span>`
            }</td>`;
        }).join('');
        return `<tr class="diff-row">
            <td class="cell label-cell">
                <span class="opt-name">${name}</span>
                <span class="opt-code">${code}</span>
            </td>
            ${cells}
        </tr>`;
    }).join('');

    // Column headers (car numbers)
    const colHeaders = cars.map((_, idx) =>
        `<th class="cell th-car">Auto #${idx + 1}</th>`
    ).join('');

    const diffCount = diffCodes.length;
    const specDiffCount = specRows.filter(r => new Set(r.values).size > 1).length;

    return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Zestawienie pojazdów — Bawaria Motors</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    
    :root {
        --black: #000000;
        --gray-900: #111111;
        --gray-700: #374151;
        --gray-500: #6B7280;
        --gray-400: #9CA3AF;
        --gray-300: #D1D5DB;
        --gray-200: #E5E7EB;
        --gray-100: #F3F4F6;
        --gray-50:  #F9FAFB;
        --white:    #FFFFFF;
        --diff-bg:  #FFFBEB;
        --diff-border: #FDE68A;
        --spec-diff-bg: #EFF6FF;
        --spec-diff-border: #BFDBFE;
        --accent:   #000000;
    }

    html, body {
        width: 297mm;
        font-family: 'Inter', -apple-system, sans-serif;
        font-size: 9pt;
        color: var(--gray-900);
        background: var(--white);
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    .page {
        width: 297mm;
        min-height: 210mm;
        padding: 10mm 12mm 10mm;
        display: flex;
        flex-direction: column;
        gap: 7mm;
    }

    /* ── HEADER ── */
    .header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        padding-bottom: 5mm;
        border-bottom: 0.5px solid var(--gray-300);
    }
    .header-left { display: flex; flex-direction: column; gap: 1mm; }
    .brand-name {
        font-size: 13pt;
        font-weight: 800;
        letter-spacing: -0.03em;
        color: var(--black);
        text-transform: uppercase;
        line-height: 1;
    }
    .brand-sub {
        font-size: 7pt;
        font-weight: 500;
        color: var(--gray-400);
        letter-spacing: 0.25em;
        text-transform: uppercase;
    }
    .header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 1mm; }
    .header-title {
        font-size: 9pt;
        font-weight: 700;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: var(--gray-900);
    }
    .header-date {
        font-size: 7pt;
        color: var(--gray-400);
        font-weight: 400;
    }
    .header-badge {
        display: inline-flex;
        align-items: center;
        gap: 1mm;
        padding: 1mm 2.5mm;
        background: var(--gray-900);
        color: var(--white);
        border-radius: 20px;
        font-size: 6.5pt;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        margin-top: 1mm;
    }

    /* ── CAR CARDS ── */
    .cars-row {
        display: grid;
        grid-template-columns: repeat(${n}, 1fr);
        gap: 4mm;
    }
    .car-card {
        background: var(--gray-50);
        border: 0.5px solid var(--gray-200);
        border-radius: 3mm;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }
    .car-img-wrap {
        position: relative;
        width: 100%;
        aspect-ratio: 21/9;
        background: var(--gray-100);
        overflow: hidden;
    }
    .car-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center 38%;
        display: block;
    }
    .car-img-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--gray-100);
    }
    .car-img-placeholder span {
        font-size: 8pt;
        font-weight: 700;
        color: var(--gray-300);
        letter-spacing: 0.2em;
        text-transform: uppercase;
    }
    .car-badge {
        position: absolute;
        top: 2mm;
        right: 2mm;
        background: rgba(255,255,255,0.88);
        border: 0.5px solid rgba(0,0,0,0.08);
        border-radius: 1.5mm;
        padding: 0.8mm 1.5mm;
        font-size: 6.5pt;
        font-weight: 700;
        color: var(--gray-500);
        letter-spacing: 0.1em;
    }
    .car-info {
        padding: 3mm 3.5mm 3.5mm;
        display: flex;
        flex-direction: column;
        gap: 1.5mm;
    }
    .car-model {
        font-size: 9pt;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--gray-900);
        line-height: 1.2;
    }
    .car-price-row { display: flex; align-items: baseline; gap: 2mm; }
    .car-price {
        font-size: 11pt;
        font-weight: 800;
        color: var(--black);
        letter-spacing: -0.02em;
    }
    .car-price-special {
        font-size: 11pt;
        font-weight: 800;
        color: var(--black);
        letter-spacing: -0.02em;
    }
    .car-price-original {
        font-size: 8pt;
        font-weight: 400;
        color: var(--gray-400);
        text-decoration: line-through;
    }
    .car-vin {
        font-size: 6pt;
        font-weight: 500;
        color: var(--gray-400);
        font-family: monospace;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    /* ── SECTION HEADERS ── */
    .section-head {
        display: flex;
        align-items: center;
        gap: 2.5mm;
        margin-bottom: 2mm;
    }
    .section-bar {
        width: 0.8mm;
        height: 4mm;
        background: var(--gray-900);
        border-radius: 2px;
    }
    .section-title {
        font-size: 7.5pt;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.35em;
        color: var(--gray-900);
    }
    .section-chip {
        margin-left: auto;
        padding: 0.5mm 2mm;
        background: var(--gray-900);
        color: var(--white);
        border-radius: 20px;
        font-size: 6pt;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    /* ── TABLE ── */
    table {
        width: 100%;
        border-collapse: collapse;
    }
    thead { }
    .cell {
        padding: 2.2mm 3mm;
        vertical-align: middle;
        border-bottom: 0.5px solid var(--gray-100);
    }
    .th-label {
        width: ${labelWidth}%;
        text-align: left;
        font-size: 6.5pt;
        font-weight: 700;
        color: var(--gray-400);
        text-transform: uppercase;
        letter-spacing: 0.2em;
        border-bottom: 0.5px solid var(--gray-200);
        padding: 2mm 3mm 2.5mm;
    }
    .th-car {
        width: ${colWidth}%;
        text-align: center;
        font-size: 6.5pt;
        font-weight: 700;
        color: var(--gray-400);
        text-transform: uppercase;
        letter-spacing: 0.2em;
        border-bottom: 0.5px solid var(--gray-200);
        padding: 2mm 3mm 2.5mm;
    }
    .label-cell {
        width: ${labelWidth}%;
        font-size: 8pt;
        font-weight: 500;
        color: var(--gray-500);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .val-cell {
        width: ${colWidth}%;
        text-align: center;
        font-size: 8pt;
        font-weight: 400;
        color: var(--gray-700);
    }
    .diff-row .label-cell {
        color: var(--gray-900);
        font-weight: 600;
    }
    .diff-row .val-cell.diff-val {
        font-weight: 600;
        color: var(--gray-900);
    }
    .diff-row {
        background-color: var(--diff-bg);
    }
    .spec-diff-row {
        background-color: var(--spec-diff-bg);
    }
    .spec-diff-row .label-cell {
        color: var(--gray-900);
        font-weight: 600;
    }
    tr:last-child .cell { border-bottom: none; }

    /* Spec rows — blue diff */
    .spec-section .diff-row {
        background-color: var(--spec-diff-bg);
    }
    .spec-section .diff-row .label-cell { color: var(--gray-900); font-weight: 600; }
    .spec-section .diff-row .diff-val { color: var(--gray-900); font-weight: 600; }

    /* Equipment icons */
    .check-cell { text-align: center; }
    .check {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 5mm;
        height: 5mm;
        border-radius: 1.5mm;
        font-size: 9pt;
        font-weight: 700;
        line-height: 1;
    }
    .check.yes {
        background: var(--gray-900);
        color: var(--white);
    }
    .check.no {
        background: transparent;
        color: var(--gray-300);
        font-size: 11pt;
    }

    .opt-name {
        display: block;
        font-size: 8pt;
        font-weight: 600;
        color: var(--gray-900);
        line-height: 1.3;
    }
    .opt-code {
        display: block;
        font-size: 6pt;
        font-weight: 500;
        color: var(--gray-400);
        font-family: monospace;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        margin-top: 0.3mm;
    }

    /* ── FOOTER ── */
    .footer {
        margin-top: auto;
        padding-top: 4mm;
        border-top: 0.5px solid var(--gray-200);
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
    }
    .footer-left { display: flex; flex-direction: column; gap: 1mm; }
    .footer-brand {
        font-size: 7pt;
        font-weight: 700;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: var(--gray-900);
    }
    .footer-contact {
        font-size: 6.5pt;
        color: var(--gray-400);
        line-height: 1.6;
    }
    .footer-disclaimer {
        font-size: 5.5pt;
        color: var(--gray-300);
        text-align: right;
        max-width: 80mm;
        line-height: 1.5;
    }
    .footer-page {
        font-size: 6pt;
        font-weight: 700;
        color: var(--gray-300);
        letter-spacing: 0.1em;
        text-transform: uppercase;
        margin-top: 1mm;
    }

    /* Separator between sections */
    .section-gap { height: 3mm; }
    
    @page {
        size: A4 landscape;
        margin: 0;
    }
    @media print {
        html, body { width: 297mm; }
        .page { page-break-after: avoid; }
    }
</style>
</head>
<body>
<div class="page">

    <!-- HEADER -->
    <div class="header">
        <div class="header-left">
            <div class="brand-name">Bawaria Motors</div>
            <div class="brand-sub">Autoryzowany Dealer BMW</div>
        </div>
        <div class="header-right">
            <div class="header-title">Zestawienie porównawcze</div>
            <div class="header-date">${today}</div>
            <div class="header-badge">
                ${n} ${n === 1 ? 'pojazd' : n <= 4 ? 'pojazdy' : 'pojazdów'} · Tylko różnice
            </div>
        </div>
    </div>

    <!-- CAR CARDS -->
    <div class="cars-row">
        ${carCards}
    </div>

    <!-- SPECIFICATION SECTION -->
    ${specDiffCount > 0 ? `
    <div class="spec-section">
        <div class="section-head">
            <div class="section-bar"></div>
            <div class="section-title">Specyfikacja</div>
            <div class="section-chip">${specDiffCount} ${specDiffCount === 1 ? 'różnica' : specDiffCount <= 4 ? 'różnice' : 'różnic'}</div>
        </div>
        <table>
            <thead>
                <tr>
                    <th class="th-label">Parametr</th>
                    ${colHeaders}
                </tr>
            </thead>
            <tbody>
                ${specRowsHtml}
            </tbody>
        </table>
    </div>
    <div class="section-gap"></div>
    ` : ''}

    <!-- EQUIPMENT DIFF SECTION -->
    ${diffCount > 0 ? `
    <div>
        <div class="section-head">
            <div class="section-bar" style="background: #9CA3AF;"></div>
            <div class="section-title">Wyposażenie — różnice</div>
            <div class="section-chip">${diffCount} ${diffCount === 1 ? 'pozycja' : diffCount <= 4 ? 'pozycje' : 'pozycji'}</div>
        </div>
        <table>
            <thead>
                <tr>
                    <th class="th-label">Opcja</th>
                    ${colHeaders}
                </tr>
            </thead>
            <tbody>
                ${equipRowsHtml}
            </tbody>
        </table>
    </div>
    ` : `
    <div style="padding: 6mm; background: var(--gray-50); border-radius: 2mm; border: 0.5px solid var(--gray-200); text-align: center;">
        <div style="font-size: 7pt; font-weight: 600; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.2em;">Wyposażenie identyczne</div>
        <div style="font-size: 6.5pt; color: var(--gray-300); margin-top: 1mm;">Wszystkie porównywane pojazdy posiadają identyczny zestaw opcji wyposażenia.</div>
    </div>
    `}

    <!-- FOOTER -->
    <div class="footer">
        <div class="footer-left">
            <div class="footer-brand">Bawaria Motors</div>
            <div class="footer-contact">
                ul. Wołoska 28, 02-675 Warszawa<br/>
                tel. +48 22 000 00 00 · kontakt@bawariamotors.pl
            </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 1mm;">
            <div class="footer-disclaimer">
                Dokument informacyjny. Ceny brutto w PLN z VAT. Wyposażenie wg danych z systemu dealerskiego. 
                Dealer zastrzega sobie prawo do zmian bez uprzedzenia.
            </div>
            <div class="footer-page">Bawaria Motors · Wirtualny Salon · ${today}</div>
        </div>
    </div>

</div>
</body>
</html>`;
}

// ── Route Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    let browser;
    try {
        const body: ComparePdfBody = await req.json();
        const { cars, dicts, diffCodes, specRows } = body;

        if (!cars || cars.length < 1) {
            return NextResponse.json({ error: 'No cars provided' }, { status: 400 });
        }

        const html = buildHtml({ cars, dicts, diffCodes, specRows });

        browser = await launchBrowser();
        const page = await browser.newPage();

        // Set A4 landscape viewport
        await page.setViewport({ width: 1123, height: 794 });

        await page.setContent(html, {
            waitUntil: 'networkidle0',
            timeout: 30_000,
        });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true,
            margin: { top: 0, bottom: 0, left: 0, right: 0 },
        });

        await browser.close();

        const n = cars.length;
        const filename = `Bawaria-Motors-Zestawienie-${n}-aut-${new Date().toISOString().slice(0, 10)}.pdf`;

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': String(pdfBuffer.length),
            },
        });
    } catch (err) {
        console.error('[compare-pdf]', err);
        if (browser) {
            try { await browser.close(); } catch {}
        }
        return NextResponse.json(
            { error: 'PDF generation failed', detail: String(err) },
            { status: 500 }
        );
    }
}
