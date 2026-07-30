# Kauvex Boss — Ops Dashboard

Project Coordination · HR · Activity · Measure & Monitor · Improvement Calculation

## Uploading to GitHub (no command line needed)

1. Unzip this folder on your computer.
2. Go to your `kauvex-boss` repo on GitHub → **Add file → Upload files**.
3. Drag the **entire unzipped folder's contents** in (not the zip itself) —
   `src/`, `package.json`, `vite.config.js`, `index.html`, `.gitignore`,
   `.env.example`, this `README.md`. Keep the folder structure — `src/App.jsx`,
   `src/main.jsx`, `src/lib/supabaseClient.js` must stay inside `src/`.
4. Commit.

## Deploying on Vercel

1. [vercel.com](https://vercel.com) → **New Project** → import `kauvex-boss`.
2. Before deploying, add Environment Variables (from `.env.example`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy.
4. Project Settings → Domains → add `boss.kauvex.io`.
5. Add the CNAME record Vercel shows you to kauvex.io's DNS.

See the full DEPLOY_GUIDE.md (sent earlier in chat) for details.
