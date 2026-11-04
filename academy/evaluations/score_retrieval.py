"""Evaluate search relevance and answer grounding on a captured Wonder Toys run."""
import argparse
import importlib.metadata
import json
from pathlib import Path
import re

from phoenix.client import Client
from phoenix.evals import LLM
from phoenix.evals.metrics import FaithfulnessEvaluator, RetrievalRelevanceEvaluator

from academy.evaluations.budget_judge import DEFAULT_MODEL, load_model_key, result_dict
from academy.evaluations.score_runs import root_evidence


def messages(attributes: dict, direction: str) -> list[dict]:
    prefix = f"llm.{direction}_messages."
    indices = sorted({int(k[len(prefix):].split('.')[0]) for k in attributes if k.startswith(prefix)})
    result = []
    for index in indices:
        base = f"{prefix}{index}.message."
        text = attributes.get(base + 'content')
        if not text:
            pattern = re.compile(re.escape(base) + r'contents\.(\d+)\.message_content\.text$')
            parts = sorted((int(m[1]), v) for k, v in attributes.items() if (m := pattern.match(k)))
            text = '\n'.join(v for _, v in parts if isinstance(v, str))
        result.append({'role': attributes.get(base + 'role'), 'name': attributes.get(base + 'name'),
                       'text': text or ''})
    return result


def evidence(spans: list[dict]) -> tuple[str, str, list[dict], dict, str]:
    _, request, answer = root_evidence(spans)
    searches = [s for s in spans if s['name'] == 'search-products'
                and s.get('span_kind') == 'TOOL']
    if not searches or any(s['status_code'] != 'OK' for s in searches):
        raise ValueError('Choose a completed run with a successful search-products tool call')
    # The application root may concatenate progress text with the final model answer.
    final = [s for s in spans if s.get('span_kind') == 'LLM'
             and any(m['text'].strip() and answer.strip().endswith(m['text'].strip())
                     for m in messages(s['attributes'], 'output'))
             and not any('tool_calls.' in k for k in s['attributes'] if k.startswith('llm.output_messages.'))]
    if len(final) != 1:
        raise ValueError('Could not match the final answer to exactly one captured model call')
    # Use only product information actually present in that model call, not every tool in the trace.
    context = '\n\n'.join(m['text'] for m in messages(final[0]['attributes'], 'input')
                          if m['role'] == 'tool' and m['name'] in {'search-products', 'get-product'}
                          and m['text'])
    if not context:
        raise ValueError('The final model call has no captured product context to judge')
    answer = '\n'.join(m['text'] for m in messages(final[0]['attributes'], 'output') if m['text'])
    for search in searches:
        if not isinstance(search['attributes'].get('output.value'), str):
            raise ValueError('A search result is missing its captured output')
    return request, answer, searches, final[0], context


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--phoenix-url', default='http://localhost:6006')
    p.add_argument('--project', default='wonder-toys')
    p.add_argument('--trace-id', required=True)
    p.add_argument('--env-file', type=Path)
    p.add_argument('--output', type=Path)
    args = p.parse_args()
    load_model_key(args.env_file)
    client = Client(base_url=args.phoenix_url)
    spans = client.spans.get_spans(project_identifier=args.project, trace_ids=[args.trace_id], limit=1000)
    request, answer, searches, final, context = evidence(spans)
    llm = LLM(provider='anthropic', model=DEFAULT_MODEL)
    relevance, faithfulness = RetrievalRelevanceEvaluator(llm=llm), FaithfulnessEvaluator(llm=llm)
    checks = [(s, relevance, {'input': request, 'context': s['attributes']['output.value']}) for s in searches]
    checks.append((final, faithfulness, {'input': request, 'output': answer, 'context': context}))
    rows = []
    for span, evaluator, fields in checks:
        score = evaluator.evaluate(fields)[0]
        client.spans.add_span_annotation(
            span_id=span['context']['span_id'], annotation_name=score.name, annotator_kind='LLM',
            label=score.label, score=score.score, explanation=score.explanation,
            metadata={'model': DEFAULT_MODEL, 'evals_version': importlib.metadata.version('arize-phoenix-evals'),
                      'scope': 'retrieval-step' if evaluator is relevance else 'captured-product-context'},
            identifier='academy-retrieval-review', sync=True,
        )
        rows.append({'trace_id': args.trace_id, 'span_id': span['context']['span_id'],
                     'span_name': span['name'], 'fields': fields, 'result': result_dict(score)})
        print(f'{score.name}: {score.label} — {score.explanation}')
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(rows, indent=2) + '\n')


if __name__ == '__main__':
    main()
