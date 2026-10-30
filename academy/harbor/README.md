# Test a Wonder Toys purchase with Harbor

This exercise runs the existing Phoenix LangChain Python agent in a fresh Docker container. The shopper confirms one `toy-051` and supplies a fictional shipping address. After the agent finishes, the runner saves its actual in-memory orders. The verifier checks the cart, owner, and shipping address and emits their scores plus an overall reward.

From the repository root, with Docker running:

```sh
python3 -m academy.harbor.prepare
uv run --python 3.12 --with 'arize-phoenix-client[harbor]' python -m academy.harbor.run --env-file phoenix/langchain-py/.env.local --phoenix-url http://localhost:6006
```

The preparation script copies only the required backend source and product catalogue. The adapter runs the existing agent and saves its real messages and tool results as ATIF. The runner writes the order snapshot; the model cannot supply it directly. Credentials are read from the host and passed at execution time, never copied into the image.

Use the same command with `--agent oracle` to run the reference solution (`reward=1`), or `--agent nop` to make no purchase (`reward=0`, `infra_ok=1`). These verify the task, not the model. The actual agent experiment is `wonder-toys-purchase-check` in `harbor-task/phoenix-academy/purchase-confirmed`.

Harbor job records and collected artifacts remain in the ignored `academy/harbor/jobs/` directory. The helper does not upload them to Harbor Hub. The plugin records results only in the configured Phoenix instance. ATIF timestamps show when messages were observed, not precise operation durations.

This one task covers an authorized purchase. Add separate tasks for missing consent, cancellations, stock shortages, and another user's orders before making claims about those behaviors.

## Evaluate a coding agent

The separate [`code-budget-filter` task](code-budget-filter/instruction.md) asks a coding agent to repair a strict price filter in a fresh workspace. Its verifier checks the price boundary, preserved order, unchanged inputs, and empty results. The utility is a standalone exercise; it is not installed into the shopping assistant.

After the preparation command above, run:

```sh
uv run --python 3.12 --with 'arize-phoenix-client[harbor]' python -m academy.harbor.run --task code-budget-filter --agent claude-code --env-file phoenix/langchain-py/.env.local --phoenix-url http://localhost:6006
```

Use `--agent oracle` or `--agent nop` with this task to check the verifier independently of the coding agent. Inspect its reward, collected source file, and verifier output in the Harbor job directory alongside the corresponding Phoenix experiment.
