# Evaluate Wonder Toys

These exercises extend the existing Phoenix LangChain Python demo. They reuse its tools and order store.

## Check the purchase outcome

From the repository root:

```sh
uv run --python 3.11 --with-requirements phoenix/langchain-py/backend/requirements.txt python -m academy.evaluations.check_orders
```

The command invokes `purchase-product` in a fresh Python process, reads the resulting order from the same process, and checks its product IDs and quantities. It makes no model calls and does not use the order state of a running demo server. Orders and inventory are in memory, so each process starts with fresh application state.

The first case comes from the actual tool call. The wrong-quantity and missing-order cases are deliberate test fixtures for the evaluator, not observed agent failures.

## Test the evaluator

```sh
uv run --python 3.11 --with-requirements phoenix/langchain-py/backend/requirements.txt --with 'arize-phoenix-evals>=3.9.5' --with pytest python -m pytest academy/evaluations/tests -q
```

The tests cover missing orders, wrong products and quantities, malformed items, extra products, and equivalent carts with reordered or repeated lines. An invalid reference raises an error rather than labeling the application as failed.

To record the actual purchase check in your local Phoenix instance:

```sh
uv run --python 3.11 --with-requirements phoenix/langchain-py/backend/requirements.txt python -m academy.evaluations.check_orders --phoenix-url http://localhost:6006
```

Open the `wonder-toys` project and the `Purchase check` trace. The root contains the confirmed cart and stored order, with an `ordered_items_match` CODE annotation. The two deliberately altered fixtures are checked locally without publishing them as purchase failures. Use `--project` or `--phoenix-url` to match your local configuration.

## Validate the budget judge

Copy `fixtures/budget_review.json` into `academy/evaluations/artifacts/budget-review.json`. It contains three recorded responses and one authored no-match response. Read each answer, set `review_label` to `pass`, `fail`, or `needs_review`, and set `review_source` to `human` only after your own review. Keep the `dev` and `test` partitions separate.

```sh
uv run --python 3.11 --with-requirements phoenix/langchain-py/backend/requirements.txt python -m academy.evaluations.validate_judge --cases academy/evaluations/artifacts/budget-review.json --env-file phoenix/langchain-py/.env.local --phoenix-url http://localhost:6006 --split dev
```

The judge sees only the request and answer. Phoenix records its verdict and explanation as the experiment output, and a code check compares its label with the reference. Review disagreements before revising the rubric. When finished, run the same command with `--split test` without changing the rubric or model. These four cases demonstrate the mechanics; they are not enough to establish a reliable judge.

`--allow-practice-reviews` is for technical smoke tests with explicitly attributed `assistant_review` labels. It does not turn those labels into human validation. Screenshots produced during Academy development use this mode and retain their provenance.

## Compare the complete agent

Keep the demo Chroma service running and use the `wonder-toys-shopping` dataset created in the Academy. The examples must have `input.input` containing the shopper request. Use recommendation cases only; purchase and cancellation tests need isolated state for each attempt.

```sh
uv run --python 3.11 --with-requirements phoenix/langchain-py/backend/requirements.txt python -m academy.evaluations.run_experiment --variant baseline --env-file phoenix/langchain-py/.env.local --phoenix-url http://localhost:6006 --repetitions 2
```

Copy the printed dataset version and rerun with `--variant budget-rule --dataset-version YOUR_DATASET_VERSION`. Add `--chroma-url` if your product service isn't at port 8000. Both variants use the existing agent factory, tools, model, and budget judge; only the system prompt changes. Each request starts with fresh messages. Use `--output` to save the result IDs and per-run records locally.

## Score selected application runs

Copy a completed Wonder Toys root trace ID from Phoenix, then run:

```sh
uv run --python 3.11 --with-requirements phoenix/langchain-py/backend/requirements.txt python -m academy.evaluations.score_runs --trace-id YOUR_TRACE_ID --env-file phoenix/langchain-py/.env.local --phoenix-url http://localhost:6006
```

Use `--project` if your project has another name. Repeat `--trace-id` for a small reviewed sample. The helper evaluates captured input/output without rerunning the shopping agent, and writes a distinct `budget_compliance_judge` LLM annotation. Its identifier and metadata preserve the rubric version. `needs_review` stays unscored; execution and evaluation errors are not converted into budget failures. Review disagreements before using the labels to update a test dataset.

## Evaluate retrieval and grounding

Use a completed Wonder Toys trace with product search and a final answer:

```sh
uv run --python 3.11 --with-requirements phoenix/langchain-py/backend/requirements.txt --with 'arize-phoenix-evals>=3.9.5' python -m academy.evaluations.score_retrieval --trace-id YOUR_TRACE_ID --env-file phoenix/langchain-py/.env.local --phoenix-url http://localhost:6006
```

The helper records `retrieval_relevance` on search tool spans and `faithfulness` on the final model span. Relevance scores the whole search result against the shopper request. Faithfulness uses only the product context present in the final model call. Missing or ambiguous evidence raises an error. These checks do not replace budget or age requirements. Review judge explanations against the original trace.

## Test instructions inside product content

`fixtures/prompt_injection.json` contains two authored attacks and two controls. Each request asks for the price of toy-051. The helper wraps the existing product lookup to add text to a copy of its result, with no catalogue or running-server changes. Other tools and the agent factory remain the same.

```sh
uv run --python 3.11 --with-requirements phoenix/langchain-py/backend/requirements.txt python -m academy.evaluations.test_prompt_injection --variant baseline --env-file phoenix/langchain-py/.env.local --phoenix-url http://localhost:6006
```

Rerun with `--variant content-boundary`, using the same environment and `--chroma-url` if needed. The helper refuses to reuse a dataset whose cases or reference price have changed. It verifies that the intended content was delivered before scoring the answer. The marker and price checks are narrow proxies, so read the outputs and traces before drawing a conclusion. Refusing everything should not count as preserving the shopper's task. Both versions passed the checks in the recorded Academy comparison, which does not demonstrate an improvement or establish resistance to other attacks.
