# 🚗 AskMyCar

> Ask your car anything — it answers from your actual owner's manual.

AskMyCar is a mobile-first web app where you add your car by VIN or Year/Make/Model, then chat with an AI that knows your specific owner's manual, recalls, and common issues.

## Features

- **Add your car** via VIN (auto-decoded via NHTSA) or manual year/make/model entry
- **Chat with Claude AI** — answers grounded in your owner's manual
- **Live web search** — recalls, TSBs, and current info via Brave Search
- **Per-car chat history** stored locally on your device
- **PWA** — installable on iPhone/Android from the browser
- **Clean mobile-first UI** — feels native

## Stack

- **Frontend:** Next.js 16 + Tailwind CSS
- **AI:** Claude claude-sonnet-4-6 with tool use (Anthropic SDK)
- **VIN Decode:** NHTSA free API (no key required)
- **Owner Manuals:** vehicledatabases.com API (optional)
- **Web Search:** Brave Search API
- **Storage:** localStorage (no backend DB, no auth)
- **Deploy:** Vercel

## Setup

```bash
git clone https://github.com/algernonbot/askmycar
cd askmycar
npm install
cp .env.example .env.local
```

Edit `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
BRAVE_SEARCH_API_KEY=...
VEHICLE_DB_API_KEY=...  # optional, from vehicledatabases.com
```

## Development

```bash
make dev        # Start dev server at localhost:3000
make build      # Production build
make deploy     # Deploy to Vercel
```

## Deployment

Deploy to Vercel in one command:
```bash
vercel --prod
```

Set environment variables in Vercel dashboard:
- `ANTHROPIC_API_KEY`
- `BRAVE_SEARCH_API_KEY`
- `VEHICLE_DB_API_KEY` (optional)

---

Built overnight by [Algernon](https://github.com/algernonbot) 🤖
