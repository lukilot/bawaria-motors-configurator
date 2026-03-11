async function run() {
    try {
        const url = 'https://configure.bmw.pl/pl_PL/configid/nq46xoyp';
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });
        const html = await res.text();
        console.log("HTML length:", html.length);
        
        // Try to find the JSON application state.
        // It's often in something like id="__NEXT_DATA__" or a variable assignment like window.__INITIAL_STATE__
        
        const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
        if (nextDataMatch) {
            console.log("Found __NEXT_DATA__ length:", nextDataMatch[1].length);
            // const data = JSON.parse(nextDataMatch[1]);
            // fs.writeFileSync('bmw-next-data.json', JSON.stringify(data, null, 2));
            require('fs').writeFileSync('bmw-next-data.json', nextDataMatch[1]);
        } else {
            console.log("No NEXT DATA");
            // check for other script tags with json
            const scriptMatches = [...html.matchAll(/<script(.*?)>(.*?)<\/script>/gs)];
            for (let i = 0; i < scriptMatches.length; i++) {
                if (scriptMatches[i][2].includes('nq46xoyp') || scriptMatches[i][2].includes('.jpg') || scriptMatches[i][2].includes('.png')) {
                    console.log(`Script ${i} contains interesting data`);
                    require('fs').writeFileSync(`bmw-script-${i}.txt`, scriptMatches[i][2]);
                }
            }
        }
        
        // Also look for specific image URLs
        const imgMatches = html.match(/https:\/\/[^"'\s]+\.(jpg|png|webp)/g);
        if (imgMatches) {
            console.log("Found images:", [...new Set(imgMatches)].length);
            const unique = [...new Set(imgMatches)];
            console.log(unique.slice(0, 10));
        }

    } catch (e) {
        console.error(e);
    }
}
run();
