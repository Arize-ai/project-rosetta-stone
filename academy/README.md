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
