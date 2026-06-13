// Next.js auto-detects this file and runs `register()` once per server
// process at startup, before user-land modules load. We delegate to the
// shared tracing initialiser in `src/ai/tracing.ts`.

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { initTracing } = await import("./src/ai/tracing");
  await initTracing();
}
