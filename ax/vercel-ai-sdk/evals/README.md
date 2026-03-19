# Arize AX Evaluations — Setup Guide

This guide walks through setting up 6 evaluators in the Arize AX console to assess the Wonder Toys shopping agent.

## Prerequisites

1. **Generate traces** by running the synthetic request harness:

    ```bash
    npm run synthetic-requests
    ```

   This starts the Next.js dev server, sends 25 requests of varying complexity to `/api/chat`, waits 20 seconds for traces to sync to Arize AX, then shuts the server down. Arize AX observability runs inside the Next.js app via `src/instrumentation.ts` — no separate OTel setup is needed.

1. **Open your project** at [app.arize.com](https://app.arize.com).

## Run the evals

See the [AX Evals guide](../../../evals/README.md) for instructions on setting up and running the evals in AX.
