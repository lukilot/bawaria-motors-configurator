const fs = require('fs');
const path = require('path');

function searchDeep(dir) {
    let files;
    try {
        files = fs.readdirSync(dir);
    } catch(e) { return; }
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fullPath.includes('.git') || fullPath.includes('.gemini') || fullPath.includes('node_modules')) continue;
        
        try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                searchDeep(fullPath);
            } else {
                const text = fs.readFileSync(fullPath, 'utf8');
                if (text.includes('mr-[') && text.includes('!b')) {
                    console.log(`FOUND BOTH in ${fullPath}`);
                }
            }
        } catch (e) {
            // ignore
        }
    }
}
searchDeep('.next');
