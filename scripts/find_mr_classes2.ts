import fs from 'fs';
import path from 'path';

function search(dir: string) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fullPath.includes('node_modules') || fullPath.includes('.next') || fullPath.includes('.git') || fullPath.includes('.gemini')) return;
        if (fs.statSync(fullPath).isDirectory()) {
            search(fullPath);
        } else {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const matches = content.match(/mr-\[[^\]]+\]/g);
                if (matches) {
                    console.log(`Found in ${fullPath}:`);
                    matches.forEach(m => console.log('  ', JSON.stringify(m)));
                }
            } catch (e) {}
        }
    });
}
search('.');
