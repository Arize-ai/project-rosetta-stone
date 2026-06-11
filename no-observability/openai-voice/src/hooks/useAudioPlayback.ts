"use client";

import { useCallback, useEffect, useRef } from "react";

const SAMPLE_RATE = 24000;

/**
 * Queues base64 PCM16 chunks (24 kHz mono, as the OpenAI Realtime API
 * emits them) and plays them back-to-back through a single `AudioContext`
 * so playback sounds gapless.
 *
 *   const { play, clear } = useAudioPlayback();
 *   socket.onmessage = (e) => { if (msg.type === "audio.chunk") play(msg.data); };
 *
 * Call `clear()` on interruption to drop any not-yet-played chunks.
 */
export function useAudioPlayback() {
  const ctxRef = useRef<AudioContext | null>(null);
  const playheadRef = useRef(0);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
      playheadRef.current = ctxRef.current.currentTime;
    }
    return ctxRef.current;
  }, []);

  const play = useCallback(
    (b64: string) => {
      const ctx = ensureCtx();

      // Decode base64 → Int16 → Float32
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.length / 2);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] < 0 ? int16[i] / 0x8000 : int16[i] / 0x7fff;
      }

      const buffer = ctx.createBuffer(1, float32.length, SAMPLE_RATE);
      buffer.getChannelData(0).set(float32);

      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);

      const startAt = Math.max(playheadRef.current, ctx.currentTime);
      src.start(startAt);
      playheadRef.current = startAt + buffer.duration;
      sourcesRef.current.push(src);
      src.onended = () => {
        sourcesRef.current = sourcesRef.current.filter((s) => s !== src);
      };
    },
    [ensureCtx]
  );

  const clear = useCallback(() => {
    for (const src of sourcesRef.current) {
      try { src.stop(); } catch { /* already stopped */ }
    }
    sourcesRef.current = [];
    if (ctxRef.current) {
      playheadRef.current = ctxRef.current.currentTime;
    }
  }, []);

  useEffect(() => () => {
    clear();
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
  }, [clear]);

  return { play, clear };
}
