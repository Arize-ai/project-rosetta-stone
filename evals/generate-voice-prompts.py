"""Generate the voice-prompt MP3s used by run-voice-requests.py.

Each prompt is rendered with OpenAI's TTS API (tts-1, voice=alloy) so the
prompt set is reproducible. Re-run this script if you change a prompt or
want to regenerate. The MP3s are committed to the repo (~50 KB each) so
contributors don't need an OpenAI key just to run voice synthetic requests.

Usage:
    cd evals
    python generate-voice-prompts.py

Requires:
    OPENAI_API_KEY in env
    openai>=1.50 (`pip install openai`)
"""

from __future__ import annotations

import os
from pathlib import Path

from openai import OpenAI

# Mirror the categories from synthetic-requests.ts so voice and text exercise
# the same set of tools / flows. Multi-turn prompts are skipped — each MP3 is
# a single user utterance. Numbers/IDs are spoken as natural language so TTS
# pronounces them cleanly.
PROMPTS: list[tuple[str, str]] = [
    (
        "01-simple-search-dinosaurs",
        "Show me some dinosaur toys.",
    ),
    (
        "02-simple-search-toddlers",
        "What toys do you have for toddlers?",
    ),
    (
        "03-filtered-search-outdoor",
        "I'm looking for outdoor toys for kids aged five to eight.",
    ),
    (
        "04-filtered-search-educational",
        "What educational toys do you have for three year olds?",
    ),
    (
        "05-product-detail-popular-plush",
        "Tell me everything about your most popular stuffed animal.",
    ),
    (
        "06-purchase",
        (
            "I'd like to buy the rainbow stacking rings. "
            "Ship it to Jane Doe at one twenty three Main Street, "
            "Springfield, Illinois, six two seven zero one, United States."
        ),
    ),
    (
        "07-order-status",
        "Can you check the status of all my orders?",
    ),
    (
        "08-edge-vague",
        "I need a gift but I have no idea what to get.",
    ),
]

VOICE = "alloy"
MODEL = "tts-1"


def main() -> None:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit("OPENAI_API_KEY is not set")

    out_dir = Path(__file__).parent / "voice-prompts"
    out_dir.mkdir(exist_ok=True)

    # 30s per-call timeout — TTS replies in 1-3s in practice; anything
    # longer means a hung request that we should retry.
    client = OpenAI(api_key=api_key, timeout=30.0, max_retries=2)

    for slug, text in PROMPTS:
        path = out_dir / f"{slug}.mp3"
        if path.exists() and path.stat().st_size > 1024:
            print(f"  {path.name}  (skip — already exists)")
            continue
        print(f"  {path.name}  ({len(text)} chars)", flush=True)
        # Use the non-streaming create() — the streaming variant's
        # stream_to_file is deprecated in openai>=1.55. The plain create()
        # returns a response with `.content` (bytes) for one-shot write.
        response = client.audio.speech.create(
            model=MODEL,
            voice=VOICE,
            input=text,
            response_format="mp3",
        )
        path.write_bytes(response.content)

    # Also write a manifest so the runner doesn't need to repeat the prompts.
    manifest = out_dir / "manifest.txt"
    manifest.write_text(
        "# slug | spoken text\n"
        + "\n".join(f"{slug} | {text}" for slug, text in PROMPTS)
        + "\n"
    )
    print(f"\nWrote {len(PROMPTS)} prompts to {out_dir}/")
    print(f"Manifest: {manifest}")


if __name__ == "__main__":
    main()
