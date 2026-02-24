import fs from 'fs';
import path from 'path';

function search(dir: string) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            search(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const matches = content.match(/mr-\[[^\]]+\]/g);
            if (matches) {
                console.log(`Found in ${fullPath}:`);
                matches.forEach(m => console.log('  ', JSON.stringify(m)));
            }
        }
    });
}
search('./src');
