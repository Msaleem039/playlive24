# Live Socket Integration (Odds + Bookmaker Fancy)

This project now supports Socket.IO live updates for match odds and bookmaker/fancy on the live match screen.

## Feature Flag

Enable socket mode with:

```env
NEXT_PUBLIC_ENABLE_LIVE_SOCKET=true
```

(`ENABLE_LIVE_SOCKET=true` is also read for compatibility.)

## What It Does

- Connects to socket server using the same API base URL.
- Subscribes on match screen mount:
  - `subscribe:odds` with `{ eventId, marketIds }`
  - `subscribe:bookmaker-fancy` with `{ eventId, marketIds? }`
- Unsubscribes and disconnects on unmount/match change.
- Handles inbound events:
  - `odds:update`
  - `bookmaker-fancy:update`
- Deduplicates stale updates using `updatedAt` (older payloads are ignored).
- Tracks and exposes:
  - `oddsData`
  - `bookmakerFancyData`
  - `lastUpdated`
  - `connectionStatus` (`Live`, `Reconnecting`, `Offline`)
- Keeps REST fallback:
  - If socket remains disconnected for >5 seconds, polling resumes every 3 seconds.
  - Polling stops again after reconnect.

## Main Files

- Socket client service: `app/services/liveSocketClient.ts`
- Match socket hook: `app/live/[matchId]/hooks/useLiveMarketSocket.ts`
- Integrated data source + fallback: `app/live/[matchId]/hooks/useMatchData.ts`
- UI status indicator: `app/live/[matchId]/page.tsx`

## Local Testing

1. Start backend on the configured base URL (default in `app/services/ApiEndpoints.tsx`).
2. Set `NEXT_PUBLIC_ENABLE_LIVE_SOCKET=true`.
3. Open a live match page (`/live/[matchId]`).
4. Confirm status badge transitions:
   - Connected: `Live`
   - Network/server interruption: `Reconnecting` then `Offline`
5. Verify odds/fancy updates arrive in UI without manual refresh.
6. After >5s disconnect, confirm REST updates continue every ~3s.
7. Reconnect backend/network and confirm status returns to `Live` and polling stops.
# Waitly login page

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/saher79129-gmailcoms-projects/v0-waitly-login-page)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/RMym0PA7Qkx)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/saher79129-gmailcoms-projects/v0-waitly-login-page](https://vercel.com/saher79129-gmailcoms-projects/v0-waitly-login-page)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/RMym0PA7Qkx](https://v0.app/chat/projects/RMym0PA7Qkx)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
