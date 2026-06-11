"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioCapture } from "@/hooks/useAudioCapture";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";

/**
 * Voice-mode controller. Opens a WebSocket to the Python backend (proxied
 * via /api/voice/token to mint the user id + shared secret), captures mic
 * audio in PCM16, streams it up, and plays the assistant's audio back.
 *
 * Transcripts and tool-result markdown are passed up to the parent Chat
 * component via the supplied callbacks so they render in the same message
 * timeline as text chat.
 */
interface VoiceModeProps {
  onUserTranscript: (text: string) => void;
  onAssistantStart: () => void;
  onAssistantDelta: (delta: string) => void;
  onAssistantFinal: (text: string) => void;
  onToolMarkdown: (markdown: string) => void;
  onError: (message: string) => void;
}

interface SessionInfo {
  wsUrl: string;
  token: string;
  userId: string;
}

export function VoiceMode({
  onUserTranscript,
  onAssistantStart,
  onAssistantDelta,
  onAssistantFinal,
  onToolMarkdown,
  onError,
}: VoiceModeProps) {
  const [status, setStatus] = useState<"idle" | "connecting" | "ready" | "listening" | "speaking">(
    "idle"
  );
  const [muted, setMuted] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionInfoRef = useRef<SessionInfo | null>(null);
  // Accumulators for the in-flight assistant turn
  const assistantStartedRef = useRef(false);

  const playback = useAudioPlayback();

  const handleChunk = useCallback((b64: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "audio.chunk", data: b64 }));
    }
  }, []);

  const capture = useAudioCapture(handleChunk);

  // ----- Connect ---------------------------------------------------------

  const connect = useCallback(async () => {
    if (wsRef.current) return;
    setStatus("connecting");
    try {
      const tokenRes = await fetch("/api/voice/token", { method: "POST" });
      if (!tokenRes.ok) {
        const body = await tokenRes.json().catch(() => ({}));
        throw new Error(body.error || `Token endpoint returned ${tokenRes.status}`);
      }
      const info: SessionInfo = await tokenRes.json();
      sessionInfoRef.current = info;

      const url = new URL(info.wsUrl);
      url.searchParams.set("token", info.token);
      url.searchParams.set("user_id", info.userId);

      const ws = new WebSocket(url.toString());
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("ready");
      };

      ws.onmessage = (event) => {
        let msg: { type: string; [k: string]: unknown };
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        switch (msg.type) {
          case "session.ready":
            setStatus("ready");
            break;
          case "audio.chunk":
            if (!assistantStartedRef.current) {
              assistantStartedRef.current = true;
              onAssistantStart();
            }
            setStatus("speaking");
            playback.play(msg.data as string);
            break;
          case "transcript.user.done":
            onUserTranscript((msg.text as string) || "");
            break;
          case "transcript.assistant.delta":
            onAssistantDelta((msg.text as string) || "");
            break;
          case "transcript.assistant.done":
            onAssistantFinal((msg.text as string) || "");
            assistantStartedRef.current = false;
            setStatus("ready");
            break;
          case "tool.result":
            onToolMarkdown((msg.markdown as string) || "");
            break;
          case "speech.started":
            setStatus("listening");
            break;
          case "speech.stopped":
            setStatus("ready");
            break;
          case "error":
            onError((msg.message as string) || "Voice session error");
            break;
        }
      };

      ws.onerror = () => {
        onError("WebSocket connection error");
      };

      ws.onclose = () => {
        wsRef.current = null;
        setStatus("idle");
        capture.stop();
      };
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
      setStatus("idle");
    }
  }, [capture, onAssistantDelta, onAssistantFinal, onAssistantStart, onError, onToolMarkdown, onUserTranscript, playback]);

  const disconnect = useCallback(() => {
    capture.stop();
    wsRef.current?.close();
    wsRef.current = null;
    playback.clear();
    setStatus("idle");
  }, [capture, playback]);

  useEffect(() => {
    // Defer the connect() call so state updates from inside it don't
    // run synchronously inside this effect body (lint rule).
    const id = setTimeout(() => {
      connect();
    }, 0);
    return () => {
      clearTimeout(id);
      disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- Mic toggle (push-to-listen / always-listen) --------------------

  const toggleMic = useCallback(async () => {
    if (muted) {
      await capture.start();
      // Only mark as unmuted if the capture pipeline actually came up.
      // If start() failed (mic permission, AudioWorklet load, etc.),
      // capture.error will be set and we surface it instead.
      if (capture.error) {
        onError(`Mic capture failed: ${capture.error}`);
        return;
      }
      setMuted(false);
    } else {
      capture.stop();
      setMuted(true);
    }
  }, [capture, muted, onError]);

  const interrupt = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "interrupt" }));
    }
    playback.clear();
  }, [playback]);

  // ----- UI -------------------------------------------------------------

  const dotColor =
    status === "speaking"
      ? "bg-purple-500"
      : status === "listening"
        ? "bg-green-500"
        : status === "ready"
          ? "bg-blue-400"
          : status === "connecting"
            ? "bg-yellow-400"
            : "bg-gray-300";

  const label =
    status === "speaking"
      ? "Wonder Toys is speaking…"
      : status === "listening"
        ? "Listening…"
        : status === "ready" && !muted
          ? "Mic on — speak when ready"
          : status === "ready"
            ? "Mic off"
            : status === "connecting"
              ? "Connecting…"
              : "Not connected";

  return (
    <div className="max-w-4xl mx-auto flex items-center gap-3">
      <button
        onClick={toggleMic}
        disabled={status === "idle" || status === "connecting"}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          muted
            ? "bg-purple-600 text-white hover:bg-purple-700"
            : "bg-red-600 text-white hover:bg-red-700"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {muted ? (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
            Tap to talk
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 9.75v4.5m4.5-7.5v10.5m4.5-7.5v4.5m4.5-9v13.5" />
            </svg>
            Stop
          </>
        )}
      </button>
      <button
        onClick={interrupt}
        disabled={status !== "speaking"}
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Interrupt
      </button>
      <div className="flex items-center gap-2 text-sm text-gray-600 ml-auto">
        <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        {label}
      </div>
    </div>
  );
}
