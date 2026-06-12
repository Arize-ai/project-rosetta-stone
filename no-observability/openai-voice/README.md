# Wonder Toys — OpenAI Voice (No Observability)

This is the voice-enabled variant of the Wonder Toys shopping agent, built on the **OpenAI Agents SDK** (with the `realtime` extras) and a Python FastAPI backend. The home-page chat has a text/voice toggle — text mode uses `Agent` + `Runner` (Chat Completions), voice mode uses `RealtimeAgent` + `RealtimeRunner` over the OpenAI Realtime WebSocket.

The same five `@function_tool`-decorated functions in `backend/tools.py` drive both modes — no per-mode tool schemas, no per-mode dispatch glue.

## Architecture

- **Python FastAPI backend** (port 8001) — hosts `Agent` + `Runner` (text) and `RealtimeRunner` (voice). The SDK owns the OpenAI Realtime WebSocket, VAD wiring, and tool dispatch
- **Next.js frontend** — UI, auth, text proxy, voice WebSocket client
- **Voice path**: Browser mic → AudioWorklet (24 kHz PCM16) → browser WS → FastAPI `/voice` → `session.send_audio(...)` → SDK ↔ OpenAI Realtime → `async for event in session` → browser playback via `AudioContext`
- **Text path**: Browser → `/api/chat` (Next.js) → FastAPI `/chat` → `Runner.run_streamed(...)` → SSE
- **Tools**: 5 `@function_tool` wrappers shared by both modes (search, get product, purchase, order status, cancel order)
- **Vector search**: ChromaDB (default embeddings)

Voice mode also pushes rendered markdown product cards to the browser via a `current_voice_callback` contextvar — tools that produce visual results (`search_products`, `get_product`) invoke it after computing their result so the chat panel can render cards alongside the spoken response.

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
| `backend/voice_agent.py` | Bridges the browser WS to `RealtimeSession` events (audio in/out, transcripts, tool.result) |
| `backend/chat_agent.py` | `Agent` + `Runner.run_streamed` SSE streamer (text-mode fallback) |
| `backend/tools.py` | 5 `@function_tool` wrappers shared by voice and text modes |
| `backend/context.py` | `current_user_id` + `current_voice_callback` contextvars |
| `backend/prompt.py` | System-prompt builders for text and voice |
| `backend/main.py` | FastAPI: `/chat`, `/voice` (WS), `/products/*` |
| `backend/chroma_client.py` | ChromaDB vector search client |
| `src/components/Chat.tsx` | Chat UI with text↔voice toggle and product card rendering |
| `src/components/VoiceMode.tsx` | WS client, push-to-talk, transcript streaming |
| `src/hooks/useAudioCapture.ts` | `getUserMedia` + AudioWorklet PCM16 capture |
| `src/hooks/useAudioPlayback.ts` | Scheduled PCM16 playback via `AudioContext` |
| `public/audio-worklets/pcm16-encoder.js` | AudioWorklet — 24 kHz mono PCM16 encoder |
| `scripts/start.sh` | Dev startup (ChromaDB + Python deps + backend + Next.js) |
