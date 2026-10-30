# Understand Wonder Toys with Phoenix

Use the existing LangChain Python shopping assistant to capture a request, read its model and tool steps, and follow a conversation across 3 traces.

## Start the application

You'll need Git, Node.js 22, uv, and an Anthropic API key. Requests use your key and incur model API charges.

In one terminal, start Phoenix and leave it running:

```sh
uvx --python 3.11 arize-phoenix serve
```

In a second terminal, start from the repository root:

```sh
cd phoenix/langchain-py
npm install
cp env.example .env.local
```

Replace `.env.local` with the following, inserting your Anthropic key:

```dotenv
ANTHROPIC_API_KEY=your-anthropic-api-key
BACKEND_SECRET=academy-local-demo
BACKEND_URL=http://localhost:8001
CHROMA_URL=http://localhost:8000
PHOENIX_COLLECTOR_ENDPOINT=http://localhost:6006
PHOENIX_PROJECT_NAME=wonder-toys
```

Local Phoenix without authentication doesn't require a Phoenix API key. For Phoenix Cloud, use your collector endpoint and add `PHOENIX_API_KEY`.

Start the app from `phoenix/langchain-py`:

```sh
UV_PYTHON=3.11 npm run dev
```

The script creates a Python environment, installs dependencies, starts ChromaDB, indexes the catalog, and starts the Python backend and Next.js frontend. The first launch downloads the search embedding model.

Open Wonder Toys at http://localhost:3000 and Phoenix at http://localhost:6006. The defaults also use ports 8000 (ChromaDB) and 8001 (backend); stop conflicting demo services before starting. Keep both terminals running through the exercises.

## Follow the conversation

Open the app and send these messages in order:

1. `Find dinosaur toys for a 6-year-old under $25. Recommend at most 3 options.`
2. `Tell me more about the cheapest one you recommended. What is its product ID and age range?`
3. `Would that same toy suit a 2-year-old? Use its listed age range.`

Alternatively, run from the repository root using Python 3.10 or later:

```sh
python3 academy/understand-behavior/run.py
```

Use `--url http://localhost:3020` if your app uses a different port. Each invocation generates a new session ID and carries the actual assistant responses into the next request. It uses the same `/api/chat` endpoint as the browser. It requires no additional Python packages, makes real model calls, and does not purchase anything.

## Inspect the evidence

- **First trace:** inspect the model's search calls, product results, and recommendation. Compare the recommended prices and age ranges with the request.
- **Later traces:** inspect which product the agent understood as "the cheapest one" and "that same toy."
- **Session:** open the session in Phoenix. The conversation should contain 3 request traces with the same session ID. A user ID identifies the shopper, while the session ID identifies this conversation.

Responses and span counts vary. An over-budget recommendation is a possible finding, not a promised result. A refusal to recommend an unsuitable product can be correct behavior. Record what happened before proposing a fix.

In the browser, clicking the Wonder Toys logo clears the conversation and starts a new session. The session ID otherwise survives reloads within the same tab. Separate model tool-call histories are not retained between requests; the app sends the visible conversation history.
