const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const images = new Set();
  const apiData = [];

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('.jpg') || url.includes('.png') || url.includes('bimmer')) {
        images.add(url);
    }
    if (url.includes('api') || url.includes('graphql') || url.includes('config')) {
        try {
            // some responses might fail to buffer
            const text = await res.text();
            if (text.includes('.jpg') || text.includes('.png') || text.includes('view') || text.includes('image')) {
                apiData.push({ url, text: text.substring(0, 500) + '...' });
            }
        } catch (e) {}
    }
  });

  await page.goto('https://configure.bmw.pl/pl_PL/configid/nq46xoyp', { waitUntil: 'networkidle2' });
  
  console.log("Found images:");
  console.log([...images].filter(u => u.includes('cosy')).slice(0, 10)); // BMW often uses 'cosy' (Configurator System)

  console.log("\nFound API responses:");
  console.log(apiData.map(a => a.url));
  
  require('fs').writeFileSync('bmw-api-data.json', JSON.stringify(apiData, null, 2));

  await browser.close();
})();
