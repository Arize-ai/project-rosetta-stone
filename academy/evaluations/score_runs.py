"""Score selected application traces without rerunning the agent."""
import argparse
import json
from pathlib import Path

from phoenix.client import Client
from academy.evaluations.budget_judge import (
    DEFAULT_MODEL, evaluate_budget, load_model_key, make_budget_judge, result_dict, rubric_version,
)


def root_evidence(spans: list[dict]) -> tuple[dict, str, str]:
    roots = [span for span in spans if not span.get('parent_id')]
    if len(roots) != 1:
        raise ValueError('Expected exactly one root span; check the project and trace ID')
    root = roots[0]
    if root['status_code'] != 'OK':
        raise ValueError('Inspect the execution status before judging this answer')
    attrs = root['attributes']
    request, answer = attrs.get('input.value'), attrs.get('output.value')
    if not isinstance(request, str) or not request.strip() or not isinstance(answer, str) or not answer.strip():
        raise ValueError('The root needs a shopper request and final answer')
    if attrs.get('input.mime_type') != 'text/plain' or attrs.get('output.mime_type') != 'text/plain':
        raise ValueError('Use the Wonder Toys application root with plain-text input and output')
    return root, request, answer


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--phoenix-url', default='http://localhost:6006')
    p.add_argument('--project', default='wonder-toys')
    p.add_argument('--trace-id', action='append', required=True)
    p.add_argument('--env-file', type=Path)
    p.add_argument('--output', type=Path)
    args = p.parse_args()
    load_model_key(args.env_file)
    client = Client(base_url=args.phoenix_url)
    judge = make_budget_judge()
    rows = []
    for trace_id in dict.fromkeys(args.trace_id):
        spans = client.spans.get_spans(project_identifier=args.project, trace_ids=[trace_id], limit=1000)
        root, request, answer = root_evidence(spans)
        result = evaluate_budget(judge, request, answer)
        client.spans.add_span_annotation(
            span_id=root['context']['span_id'], annotation_name='budget_compliance_judge',
            annotator_kind='LLM', label=result.label, score=result.score, explanation=result.explanation,
            metadata={'rubric_version': rubric_version(), 'model': DEFAULT_MODEL, 'scope': 'budget-only'},
            identifier=f'academy-budget-{rubric_version()}', sync=True,
        )
        row = {'trace_id': trace_id, 'span_id': root['context']['span_id'], 'request': request,
               'response': answer, 'result': result_dict(result)}
        rows.append(row)
        print(f"{trace_id}: {result.label} — {result.explanation}")
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(rows, indent=2)+'\n')


if __name__ == '__main__':
    main()
