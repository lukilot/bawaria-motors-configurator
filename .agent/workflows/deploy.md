---
description: deploy the application to production via git push
---

// turbo-all
1. Stage all changes and commit with a descriptive message summarizing what was done
```
git -C "/Users/lukilot/Documents/Bawaria Motors" add -A && git -C "/Users/lukilot/Documents/Bawaria Motors" commit -m "<message>"
```

// turbo-all
2. Push to GitHub (Vercel auto-deploys on push to main)
```
git -C "/Users/lukilot/Documents/Bawaria Motors" push
```
