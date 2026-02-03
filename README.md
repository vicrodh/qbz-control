# QBZ Control (PWA MVP)

Remote control PWA for the QBZ desktop app.

## What it does
- Pair with QBZ over LAN using a token or QR code.
- Show now playing, play/pause, next/previous, seek, and volume.
- Search Qobuz tracks (read-only).

## Local development
1. Start QBZ with Remote Control enabled (Settings -> Remote Control).
2. Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

3. Open the URL printed by Vite on a device in the same network.
4. Pair using Base URL + Token (or QR) from QBZ Settings.

## Build
```bash
npm run build
```

## GitHub Pages
- This repo deploys automatically from `main` using GitHub Actions.
- Custom domain: `control.qbz.lol` (CNAME included).
- The PWA should be installed from HTTPS (GitHub Pages), then used on the local network.

## Notes
- The backend only accepts LAN requests and whitelisted origins.
