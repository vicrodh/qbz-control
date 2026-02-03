# QBZ Control PWA Wiring Guide

This document explains how the PWA is wired to the QBZ remote control API and where to add new functionality.

## Architecture overview
- Frontend: React + Vite + TypeScript.
- PWA: `vite-plugin-pwa` with `manifest.webmanifest`.
- Routing: React Router (hash-based) for simple static hosting.
- State: local component state + localStorage for pairing config.
- Transport: REST + WebSocket to the QBZ local API.

## Key files
- `src/App.tsx`
  - Owns the app state: config, connection status, playback, track.
  - Starts polling and WebSocket refresh.
  - Provides handlers for play/pause/next/previous/seek/volume.
- `src/lib/api.ts`
  - `apiFetch`, `apiJson`, `buildWsUrl` helpers.
- `src/lib/storage.ts`
  - Saves base URL + token in localStorage.
- `src/lib/qr.ts`
  - Parses QR payload into `{ baseUrl, token }`.
- `src/components/Pairing.tsx`
  - Manual pairing (Base URL + Token).
  - QR scan pairing using camera and `qr-scanner`.
- `src/components/Controls.tsx`
  - Now playing UI + transport controls + seek/volume.
- `src/components/Search.tsx`
  - Qobuz track search read-only view.
- `public/manifest.webmanifest`
  - PWA manifest.

## API endpoints used
- `GET /api/ping`
  - Used for connection test.
- `GET /api/now-playing`
  - Used for now playing and playback state.
- `POST /api/playback/play`
- `POST /api/playback/pause`
- `POST /api/playback/next`
- `POST /api/playback/previous`
- `POST /api/playback/seek` with JSON `{ "position": number }`
- `POST /api/playback/volume` with JSON `{ "volume": number }`
- `GET /api/search?q=...&limit=...&offset=...`
- `GET /api/ws` (WebSocket, uses `token` query param)

## Auth
- REST requests use `X-API-Key` header.
- WebSocket uses `?token=` in the URL.

## QR payload
- QBZ emits JSON with at least:
  - `url`
  - `token`
  - Optional: `name`, `version`

Example:
```json
{
  "url": "http://192.168.0.210:8182",
  "token": "...",
  "name": "QBZ",
  "version": "1.1.8"
}
```

## How to add new controls
1. Add a new endpoint in QBZ (see `qbz-nix` wiring doc).
2. Add a handler in `src/App.tsx` to call the new endpoint.
3. Pass the handler into the relevant component.
4. Update the UI component to call the handler.

## Hosting notes
- The PWA is built for GitHub Pages and uses hash routing.
- `public/CNAME` is set to `control.qbz.lol`.
- HTTPS hosting is required for installability.
- Runtime requests still go to local QBZ over LAN.
