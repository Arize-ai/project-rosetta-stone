"""Replay the Academy shopping conversation against a running Wonder Toys app."""
import argparse
import json
from urllib.request import Request, urlopen
from uuid import uuid4

TURNS = [
    "Find dinosaur toys for a 6-year-old under $25. Recommend at most 3 options.",
    "Tell me more about the cheapest one you recommended. What is its product ID and age range?",
    "Would that same toy suit a 2-year-old? Use its listed age range.",
]


def run_conversation(base_url: str, session_id: str) -> list[dict]:
    messages = []
    for index, query in enumerate(TURNS, start=1):
        messages.append({"role": "user", "content": query})
        request = Request(
            f"{base_url.rstrip('/')}/api/chat",
            data=json.dumps({"messages": messages}).encode(),
            headers={"Content-Type": "application/json", "X-Session-ID": session_id},
        )
        chunks = []
        completed = False
        with urlopen(request, timeout=120) as response:
            for raw_line in response:
                line = raw_line.decode().strip()
                if not line.startswith("data: "):
                    continue
                payload = line[6:]
                if payload == "[DONE]":
                    completed = True
                    break
                event = json.loads(payload)
                chunks.append(event.get("text", ""))
        if not completed:
            raise RuntimeError(f"Turn {index} ended before the agent finished")
        answer = "".join(chunks)
        if not answer:
            raise RuntimeError(f"Turn {index} returned no answer")
        messages.append({"role": "assistant", "content": answer})
        print(f"\nTurn {index}\nYou: {query}\nWonder Toys: {answer}")
    return messages


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://localhost:3000")
    parser.add_argument("--session-id", default=None)
    args = parser.parse_args()
    session_id = args.session_id or str(uuid4())
    print(f"Conversation session: {session_id}")
    print("Sends 3 requests to your app. Normal model API charges apply.")
    run_conversation(args.url, session_id)
    print(f"\nOpen session {session_id} in your Phoenix project.")


if __name__ == "__main__":
    main()
