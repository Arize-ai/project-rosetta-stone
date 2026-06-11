# Wonder Toys — OpenAI Voice (No Observability)

This is the voice-enabled variant of the Wonder Toys shopping agent, built on the **OpenAI Realtime API** with a Python FastAPI backend. The home-page chat has a text/voice toggle — text mode uses GPT-4o Chat Completions, voice mode streams audio in and out via the Realtime API.

Two tiers only for this framework: `no-observability/` and `ax/`. Phoenix is intentionally skipped — the audio tracing recipe is AX-specific.

## Architecture

- **Python FastAPI backend** (port 8001) — Realtime API bridge, Chat Completions text fallback, tool dispatch, product/auth helpers
- **Next.js frontend** — UI, auth, text proxy, voice WebSocket client
- **Voice path**: Browser mic → AudioWorklet (24 kHz PCM16) → browser WS → FastAPI `/voice` → OpenAI Realtime WS → audio deltas back → browser playback via `AudioContext`
- **Text path**: Browser → `/api/chat` (Next.js) → FastAPI `/chat` → OpenAI Chat Completions SSE
- **Tools**: 5 plain Python functions shared by both modes (search, get product, purchase, order status, cancel order)
- **Vector search**: ChromaDB (default embeddings)

## Running

```bash
cp env.example .env.local   # set OPENAI_API_KEY, TWITTER_*, etc.
npm install
npm run dev                 # ChromaDB + Python deps + backend + Next.js
```

See the [root README](../../README.md) for full details.

## Key Files

| File | Purpose |
|------|---------|
| `backend/voice_agent.py` | OpenAI Realtime ⇄ browser WebSocket bridge + tool dispatch |
| `backend/chat_agent.py` | OpenAI Chat Completions SSE streamer (text-mode fallback) |
| `backend/tools.py` | 5 tool implementations + shared OpenAI tool schemas |
| `backend/audio.py` | PCM16 helpers (no-op `persist_wav` in this tier) |
| `backend/prompt.py` | System-prompt builders for text and voice |
| `backend/main.py` | FastAPI: `/chat`, `/voice` (WS), `/products/*` |
| `backend/chroma_client.py` | ChromaDB vector search client |
| `src/components/Chat.tsx` | Chat UI with text↔voice toggle and product card rendering |
| `src/components/VoiceMode.tsx` | WS client, push-to-talk, transcript streaming |
| `src/hooks/useAudioCapture.ts` | `getUserMedia` + AudioWorklet PCM16 capture |
| `src/hooks/useAudioPlayback.ts` | Scheduled PCM16 playback via `AudioContext` |
| `public/audio-worklets/pcm16-encoder.js` | AudioWorklet — 24 kHz mono PCM16 encoder |
| `scripts/start.sh` | Dev startup (ChromaDB + Python deps + backend + Next.js) |
