const fs = require('fs');
const path = require('path');

function searchDeep(dir) {
    let files;
    try {
        files = fs.readdirSync(dir);
    } catch(e) { return; }
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fullPath.includes('.git') || fullPath.includes('.gemini') || fullPath.includes('scripts/deep_search_mr.js')) continue;
        
        try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                searchDeep(fullPath);
            } else {
                const text = fs.readFileSync(fullPath, 'utf8');
                if (text.includes('mr-[') && text.includes('!b')) {
                    console.log(`FOUND EXACT in ${fullPath}`);
                    const idx = text.indexOf('mr-[');
                    console.log('Snippet:', text.substring(Math.max(0, idx - 10), Math.min(text.length, idx + 30)));
                } else if (text.includes('mr-[\\11')) {
                    console.log(`FOUND \\11 in ${fullPath}`);
                }
            }
        } catch (e) {
            // ignore
        }
    }
}
searchDeep('.');
