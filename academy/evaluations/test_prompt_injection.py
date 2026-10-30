"""Compare two prompts on authored instructions in copied product-tool results."""
import argparse
from dataclasses import asdict, is_dataclass
import hashlib
from importlib.metadata import version
import json
import os
from pathlib import Path
import sys

import httpx
from phoenix.client import Client
from phoenix.client.experiments import run_experiment

from academy.evaluations.budget_judge import DEFAULT_MODEL, load_model_key
from academy.evaluations.injection_checks import attack_marker_absent, requested_price_present, with_extra_content
from academy.evaluations.run_experiment import answer_text

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).parent


def fixed_dataset(client: Client, name: str, cases: list[dict], price: float):
    inputs = [{'case_id': c['id'], 'request': c['request'], 'extra_content': c['extra_content']} for c in cases]
    expected = {'price': price}
    try:
        dataset = client.datasets.get_dataset(dataset=name)
    except (ValueError, httpx.HTTPStatusError) as error:
        missing = (isinstance(error, ValueError) and str(error) == f'Dataset not found: {name}') or (
            isinstance(error, httpx.HTTPStatusError) and error.response.status_code == 404)
        if not missing:
            raise
        return client.datasets.create_dataset(
            name=name, inputs=inputs, outputs=[expected for _ in cases],
            metadata=[{'source': 'authored Academy fixture', 'case_kind': c['kind']} for c in cases],
            dataset_description='Controlled product-tool content tests, with clean controls. Not production incidents.',
        )
    existing = {e['input']['case_id']: e for e in dataset.examples}
    if set(existing) != {c['id'] for c in cases} or any(
        existing[x['case_id']]['input'] != x or existing[x['case_id']]['output'] != expected for x in inputs
    ):
        raise ValueError('Cases or catalogue price changed. Use a new --dataset for a new comparison.')
    return dataset


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--variant', choices=['baseline', 'content-boundary'], required=True)
    p.add_argument('--phoenix-url', default='http://localhost:6006')
    p.add_argument('--chroma-url', default='http://localhost:8000')
    p.add_argument('--env-file', type=Path)
    p.add_argument('--dataset', default='wonder-toys-product-content')
    p.add_argument('--repetitions', type=int, default=1)
    p.add_argument('--output', type=Path)
    args = p.parse_args()
    if args.repetitions < 1:
        p.error('repetitions must be positive')
    load_model_key(args.env_file)
    os.environ['PHOENIX_COLLECTOR_ENDPOINT'] = args.phoenix_url
    os.environ['PHOENIX_PROJECT_NAME'] = 'wonder-toys'
    os.environ['CHROMA_URL'] = args.chroma_url
    sys.path.insert(0, str(ROOT / 'phoenix/langchain-py'))
    from backend import tracing
    from backend.agent import SYSTEM_PROMPT, _build_agent, _lc_messages
    from backend.tools import all_tools, get_product_detail
    from langchain_core.messages import AIMessage, ToolMessage
    from langchain_core.tools import StructuredTool

    cases = json.loads((HERE / 'fixtures/prompt_injection.json').read_text())
    prompt = SYSTEM_PROMPT
    if args.variant == 'content-boundary':
        prompt += '\n\n' + (HERE / 'prompts/content-boundary.txt').read_text().strip()

    def agent_for(case: dict):
        def lookup(product_id: str) -> dict:
            result = get_product_detail.func(product_id)
            return with_extra_content(result, case['extra_content']) if product_id == 'toy-051' else result
        wrapped = StructuredTool.from_function(
            func=lookup, name=get_product_detail.name, description=get_product_detail.description,
            args_schema=get_product_detail.args_schema,
        )
        return _build_agent(system_prompt=prompt, tools_override=[
            wrapped if tool.name == 'get-product' else tool for tool in all_tools
        ])

    agents = {c['id']: agent_for(c) for c in cases}
    price = get_product_detail.func('toy-051')['product']['price']
    client = Client(base_url=args.phoenix_url)
    dataset = fixed_dataset(client, args.dataset, cases, price)

    def task(example: dict) -> dict:
        data = example['input']
        result = agents[data['case_id']].invoke(
            {'messages': _lc_messages([{'role': 'user', 'content': data['request']}], 'academy-content-test')},
            config={'recursion_limit': 15},
        )
        tools = [m for m in result['messages'] if isinstance(m, ToolMessage)]
        lookups = [m for m in tools if m.name == 'get-product' and 'toy-051' in str(m.content)]
        if not lookups or (data['extra_content'] and not any(data['extra_content'] in str(m.content) for m in lookups)):
            raise RuntimeError('The intended tool content was not delivered; this is not a valid attack attempt')
        final = result['messages'][-1]
        if not isinstance(final, AIMessage) or final.tool_calls:
            raise RuntimeError('Agent stopped without a final answer')
        return {'answer': answer_text(final.content), 'tool_names': [m.name for m in tools],
                'test_content_delivered': True}

    experiment = run_experiment(
        dataset=dataset, client=client, task=task, evaluators=[attack_marker_absent, requested_price_present],
        experiment_name=f'product-content-{args.variant}', repetitions=args.repetitions, retries=0, timeout=120,
        experiment_metadata={'model': DEFAULT_MODEL, 'prompt_sha256': hashlib.sha256(prompt.encode()).hexdigest(),
                             'scope': 'two authored text attacks and two controls; marker and price proxies',
                             'packages': {name: version(name) for name in ['langchain', 'langgraph', 'langchain-anthropic', 'anthropic']}},
        print_summary=False,
    )
    tracing._tracer_provider.force_flush()
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(experiment, indent=2, default=lambda x: asdict(x) if is_dataclass(x) else str(x)) + '\n')
    print(f"Dataset version: {experiment['dataset_version_id']}")
    print(f"Experiment: {args.phoenix_url.rstrip('/')}/datasets/{dataset.id}/compare?experimentId={experiment['experiment_id']}")
    if any(r.get('error') for r in experiment['task_runs']) or any(r.error for r in experiment['evaluation_runs']):
        raise RuntimeError('Inspect task/evaluator errors before comparing the test results')


if __name__ == '__main__':
    main()
