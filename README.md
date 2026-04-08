# Vocab App

Cross-platform vocabulary and flashcard practice built with **Expo** (React Native). Uses a Leitner-style schedule for reviews. Data can stay **fully local** or sync through an optional **Express + MongoDB** backend when you set `EXPO_PUBLIC_API_URL`.

---

## Features

| Area | What it does |
|------|----------------|
| **Daily** | Today’s progress, daily goal, quick jump into review. |
| **Library** | Sets and cards; search, edit, and delete. |
| **Explore** | Global search across sets and cards (and notes where applicable). |
| **Add** | Center tab — quick add a word to a set. |
| **Notes** | Rich text (bold, headings, highlights) via `@10play/tentap-editor` in a WebView. |
| **Settings** | Profile-style stats, daily goal, app info. |
| **Review** | Flip cards; rate (forgot / hard / good / easy) and SRS updates. |

**Storage behavior**

- **No API URL:** SQLite on iOS/Android, `localStorage` on web — sets, cards, and notes all stay on the device/browser.
- **With API URL:** Sets, cards, and notes are read/written through the backend (JWT after sign-in). Use the same `EXPO_PUBLIC_API_URL` port as the server’s `PORT`.

**Rich text / WebView:** If the note editor misbehaves in **Expo Go**, use a **development build** (`expo prebuild` / EAS) for reliable WebView behavior.

---

## Requirements

- **Node.js** 18+
- **npm** (or yarn/pnpm)
- **Native:** Xcode (iOS) and/or Android Studio — or run on web with `w` in Expo CLI
- **Backend (optional):** MongoDB

---

## Quick start — app only (local data)

```bash
npm install
npx expo start
```

Then press **`i`** (iOS simulator), **`a`** (Android emulator), or **`w`** (web).

---

## Optional — run with the API

### 1. Start the server

```bash
cd server
cp .env.example .env
# Set MONGODB_URI, PORT, JWT_SECRET as needed
npm install
npm run dev
```

Defaults in `server/.env.example`: `PORT=3001`, `MONGODB_URI=mongodb://127.0.0.1:27017/vocab`.

### 2. Point the app at the API

From the **repository root**:

```bash
cp .env.example .env
```

Set (example — **use the same port as the server**):

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

Restart the Expo dev server after changing env. Register or sign in when the app prompts; the client sends a JWT for API calls.

### 3. Physical device + API

`localhost` on the phone is the phone itself, not your computer.

- Use your machine’s LAN IP and the server port, e.g. `http://192.168.1.42:3001`.
- Phone and computer on the same Wi‑Fi; open the port in the OS firewall if needed.
- For tricky networks, `npx expo start --tunnel` may help for the app UI; the API URL must still be reachable from the device.

---

## Environment variables

| Variable | Where | Description |
|----------|--------|-------------|
| `EXPO_PUBLIC_API_URL` | Root `.env` | Backend base URL. If unset, the app uses local storage only. |
| `PORT` | `server/.env` | HTTP port (default `3001`). |
| `MONGODB_URI` | `server/.env` | MongoDB connection string. |
| `JWT_SECRET` | `server/.env` | JWT signing secret (required in production). |
| `CORS_ORIGIN` | `server/.env` | Optional comma-separated allowed origins. |
| `RATE_LIMIT_MAX` | `server/.env` | Optional requests per IP per 15 minutes (default `500`). |

---

## Scripts

**App (root)**

| Command | Description |
|---------|-------------|
| `npm start` | Expo dev server |
| `npm run ios` | iOS (`expo run:ios`) |
| `npm run android` | Android (`expo run:android`) |
| `npm run web` | Web |
| `npm test` | Jest |

**Server (`server/`)**

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with reload (`ts-node-dev`) |
| `npm run build` | Compile TypeScript to `server/dist/` |
| `npm start` | Run compiled `node dist/index.js` |

---

## Project layout (high level)

```
app/           # expo-router screens (tabs, note editor, review, add, auth)
components/    # UI (including design-system-style pieces under components/ui/)
lib/           # DB abstraction, hooks, API client, note helpers
server/src/    # Express API, Mongoose models, routes
```

---

## MongoDB note (existing data)

If the database had sets/cards from **before** per-user `userId` fields, older documents might not match the current API. For a clean slate you can drop affected collections (`sets`, `cards`) or point `MONGODB_URI` at a new database name. Users created via `/api/auth/register` remain valid.

---

## Tech stack

- **Client:** Expo ~54, React 19, React Native, **expo-router**, **expo-sqlite** (native) / `localStorage` (web)
- **Notes UI:** `@10play/tentap-editor`, `react-native-webview`
- **Server:** Express, Mongoose, `helmet`, `express-rate-limit`, JWT auth
