# Vocab App

A vocabulary and flashcard app built with Expo (React Native) for iOS, Android, and Web. Uses Leitner-style spaced repetition (SRS) for review scheduling.

## Features

- **Daily** – Today’s progress, daily goal, and quick access to start learning or open sets.
- **Library** – Sets and cards; search within sets, edit, delete.
- **Explore** – Search across all sets (words and meanings).
- **Progress** – Total words, reviewed today, daily goal %, counts by set.
- **Settings** – Profile-style stats and app info.
- **Review** – Flip cards, rate (forgot / hard / good / easy), SRS updates.

Data can be stored locally (SQLite on native, localStorage on web) or via an optional backend API.

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- For native: Xcode (iOS) and/or Android Studio (Android)
- Optional backend: MongoDB (for API mode)

### Install and run (app only, local storage)

```bash
npm install
npx expo start
```

Then press `i` for iOS simulator, `a` for Android emulator, or `w` for web.

- **Native (iOS/Android):** Data is stored in SQLite (`vocab.db`).
- **Web:** Data is stored in `localStorage` (persists across refreshes).

### Optional: run with backend API

1. **Start the server** (uses MongoDB):

   ```bash
   cd server
   cp .env.example .env
   # Edit .env if needed (PORT, MONGODB_URI)
   npm install
   npm run dev
   ```

   Default: `PORT=3001`, `MONGODB_URI=mongodb://127.0.0.1:27017/vocab`.

2. **Point the app to the API:**

   In the project root:

   ```bash
   cp .env.example .env
   ```

   Set in `.env`:

   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3001
   ```

   Restart Expo. The app will use the API instead of local storage (SQLite/web).

## Environment variables

| Variable | Where | Description |
|----------|--------|-------------|
| `EXPO_PUBLIC_API_URL` | App (root `.env`) | Backend base URL. If set, app uses API; otherwise local SQLite (native) or localStorage (web). |
| `PORT` | Server (`server/.env`) | HTTP port (default `3001`). |
| `MONGODB_URI` | Server (`server/.env`) | MongoDB connection string (default `mongodb://127.0.0.1:27017/vocab`). |

## Scripts

- `npm start` – Start Expo dev server.
- `npm run android` – Run on Android.
- `npm run ios` – Run on iOS.
- `npm run web` – Run in web browser.

## Tech stack

- **Expo** ~54, **React Native** 0.81, **expo-router** (file-based routing).
- **Storage:** expo-sqlite (native), localStorage (web), or REST API (Express + Mongoose) when `EXPO_PUBLIC_API_URL` is set.
