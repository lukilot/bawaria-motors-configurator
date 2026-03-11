/**
 * Launches a browser that works both locally (puppeteer) and on Vercel (@sparticuz/chromium + puppeteer-core).
 */
export async function launchBrowser() {
    const isVercel = !!process.env.VERCEL;

    if (isVercel) {
        const chromium = (await import('@sparticuz/chromium')).default;
        const puppeteer = await import('puppeteer-core');

        const browser = await puppeteer.default.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(),
            headless: true,
        });
        return browser;
    } else {
        // Local dev — use regular puppeteer with locally installed Chrome
        const puppeteer = await import('puppeteer');
        const browser = await puppeteer.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
        return browser;
    }
}
