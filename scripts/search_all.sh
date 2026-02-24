#!/bin/bash
find . -type f \( -name "*.js" -o -name "*.tsx" -o -name "*.ts" -o -name "*.html" -o -name "*.css" \) ! -path "*/node_modules/*" ! -path "*/.git/*" -print0 | xargs -0 grep -Hn "!b"
