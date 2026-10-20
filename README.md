# Tools Hub

Fast, client-side utilities. No backend, no database.

## Stack

- **Vite** + **React 19** + **TypeScript**
- **React Router** for multi-page navigation
- Pure static output → perfect for Vercel

## Local development

```bash
cd tools-hub
npm install
npm run dev
```

Open http://localhost:5173

## Build for production

```bash
npm run build
```

Output goes to `dist/`.

## Deploy to Vercel

1. Push this folder to a GitHub repo (or use Vercel CLI)
2. Import the project in Vercel
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Deploy

`vercel.json` already contains the SPA rewrite so routes like `/csv-to-sql` work.

## Project structure

```
src/
  components/     # Shared UI (Layout, nav)
  pages/          # Route pages (Home, CsvToSql, future tools)
  lib/            # Pure business logic (csvToSql.ts)
  styles/         # Global design tokens + base styles
```

## Adding a new tool later

1. Create `src/pages/MyNewTool.tsx` + CSS
2. Add a route in `src/App.tsx`
3. Add an entry in the `tools` array in `src/pages/Home.tsx`
4. Optionally add a nav link in `Layout.tsx`
# prodops-tools
