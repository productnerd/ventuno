# 21 Ventuno · Menu Workshop

Static React app (Vite + Tailwind) for working through the 21 Ventuno menu revamp. No backend, no database. State is saved to your browser's `localStorage`, exportable as JSON.

## Local development

```bash
npm install
npm run dev
```

Open the URL printed by Vite (default `http://localhost:5173/ventuno/`).

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

1. Push this repo to GitHub. The repo name is assumed to be `ventuno`. If you use a different name, update `base` in `vite.config.js` to match (it must equal `/<repo-name>/`).
2. In the GitHub repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and publishes automatically. The site will be at `https://<your-username>.github.io/ventuno/`.

## How state works

- All edits autosave to `localStorage` under the key `ventuno_menu_v3`.
- State is per-browser, per-device. Two people on different machines see independent copies.
- Use **Export JSON** to share a snapshot. To load someone else's snapshot, paste it into the localStorage key in DevTools, or extend the app with an import button later.
- **Reset** wipes local state and reloads the seed menu.

## Project structure

```
.
├── index.html
├── vite.config.js          # base path = /ventuno/
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx             # the workshop component
│   └── index.css
└── .github/workflows/deploy.yml
```
