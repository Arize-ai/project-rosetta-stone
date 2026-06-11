"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Captures microphone audio, downsamples to 24 kHz mono PCM16, and yields
 * base64-encoded chunks via the provided `onChunk` callback.
 *
 * Lifecycle: call `start()` to open the mic + worklet. Each chunk delivered
 * by the worklet is encoded to base64 and pushed to `onChunk`. Call `stop()`
 * to release the stream.
 */
export function useAudioCapture(onChunk: (b64: string) => void) {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const onChunkRef = useRef(onChunk);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the latest callback without re-creating the node on every render
  useEffect(() => {
    onChunkRef.current = onChunk;
  }, [onChunk]);

  const start = useCallback(async () => {
    if (ctxRef.current) return;
    setError(null);
    try {
      // Create the AudioContext FIRST inside the user-gesture handler so
      // it's not left in the "suspended" state after `await getUserMedia`
      // consumes the gesture. Mic-permission-grant takes a few seconds and
      // an AudioContext created after that point may never auto-resume on
      // Chromium/Safari.
      const ctx = new AudioContext();
      ctxRef.current = ctx;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      // Belt-and-braces: explicitly resume if the context is suspended for
      // any reason (Safari often is even after a gesture).
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      await ctx.audioWorklet.addModule("/audio-worklets/pcm16-encoder.js");

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const node = new AudioWorkletNode(ctx, "pcm16-encoder");
      nodeRef.current = node;
      node.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
        const bytes = new Uint8Array(e.data);
        // Convert to base64 in chunks so we don't blow the stack
        let bin = "";
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        const b64 = btoa(bin);
        onChunkRef.current(b64);
      };

      source.connect(node);
      // AudioWorkletNode without a downstream connection still has its
      // process() invoked, but Chromium's optimizer can decide not to
      // schedule it if nothing pulls from it. Route through a muted gain
      // node connected to destination so the audio graph stays "live".
      const sink = ctx.createGain();
      sink.gain.value = 0;
      node.connect(sink);
      sink.connect(ctx.destination);

      setIsCapturing(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      // eslint-disable-next-line no-console
      console.error("[useAudioCapture] start failed:", e);
    }
  }, []);

  const stop = useCallback(() => {
    nodeRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => {});
    nodeRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    ctxRef.current = null;
    setIsCapturing(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { start, stop, isCapturing, error };
}
