# Phoenix Academy exercises

These exercises accompany [Phoenix Academy](https://arize.com/docs/phoenix/learn). They reuse the existing Wonder Toys shopping assistant in `phoenix/langchain-py`.

| Part of the learning path | Companion code |
| --- | --- |
| Understand behavior | [Start the application and follow a conversation](understand-behavior/README.md) |
| Find failures | Review traces and annotations in Phoenix, then save representative requests as dataset examples. |
| Design evaluations | [Check purchase outcomes and validate the budget judge](evaluations/README.md) |
| Test a change | [Compare agent versions](evaluations/README.md#compare-the-complete-agent) and [verify a purchase with Harbor](harbor/README.md) |
| Ship and repeat | [Release decision template](release/decision-template.md), [CI checks](../.github/workflows/academy-checks.yml), and [score captured runs](evaluations/README.md#score-selected-application-runs) |
| Further workflows | [Coding-agent task](harbor/code-budget-filter/instruction.md), [retrieval and grounding](evaluations/README.md#evaluate-retrieval-and-grounding), and [prompt injection tests](evaluations/README.md#test-instructions-inside-product-content) |

Run commands from the repository root unless a lesson says otherwise. Model-based exercises use your Anthropic API key and make real API calls. Purchase checks and their unit tests run without a model or a running app. Harbor tasks need Docker.

Keep credentials in your local environment or the ignored application `.env.local` file. Generated artifacts and Harbor jobs are ignored. Recorded responses are examples; your agent and judge results can differ.

## Changes to the existing demo

The Academy uses only `phoenix/langchain-py`. The AX and uninstrumented demos keep their existing behavior. The changes to the Phoenix demo support these lessons:

| Existing file | Purpose |
| --- | --- |
| [`backend/agent.py`](../phoenix/langchain-py/backend/agent.py) | Record a readable agent request and response, mark completed runs, and attach the conversation ID. Optional factory arguments let experiments supply a candidate prompt or copied tool response; normal app calls keep the original prompt, model, and tools. |
| [`backend/main.py`](../phoenix/langchain-py/backend/main.py) | Accept the conversation header and keep the agent operation as the trace root. Requests without the header receive a new conversation ID. |
| [`backend/tracing.py`](../phoenix/langchain-py/backend/tracing.py) | Send traces over HTTP to the local or Cloud endpoint configured for the lesson. |
| [`src/app/api/chat/route.ts`](../phoenix/langchain-py/src/app/api/chat/route.ts) | Forward the conversation ID through the existing streaming proxy. |
| [`src/components/Chat.tsx`](../phoenix/langchain-py/src/components/Chat.tsx) | Keep one conversation ID per chat and replace it when the shopper starts a new chat. |

The purchase tools, inventory, catalogue, base system prompt, and demo dependency files are unchanged. The exercises run separately; starting the normal application does not run evaluations or Harbor tasks. Purchase-check processes and Harbor containers have their own in-memory order state.
