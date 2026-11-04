from copy import deepcopy

import pytest

from academy.evaluations.score_retrieval import evidence


def captured_run():
    return [
        {'name': 'Wonder Toys', 'parent_id': None, 'status_code': 'OK', 'span_kind': 'AGENT',
         'attributes': {'input.value': 'Find dinosaur toys under $25.', 'input.mime_type': 'text/plain',
                        'output.value': 'Searching now.\nThe kit costs $27.99.', 'output.mime_type': 'text/plain'}},
        {'name': 'search-products', 'parent_id': 'root', 'status_code': 'OK', 'span_kind': 'TOOL',
         'attributes': {'output.value': 'Earlier results not passed to the final model.'}},
        {'name': 'ChatAnthropic', 'parent_id': 'root', 'status_code': 'OK', 'span_kind': 'LLM',
         'attributes': {'llm.input_messages.2.message.role': 'tool',
                        'llm.input_messages.2.message.name': 'search-products',
                        'llm.input_messages.2.message.content': 'Kit: $27.99.',
                        'llm.output_messages.0.message.role': 'assistant',
                        'llm.output_messages.0.message.contents.0.message_content.text': 'The kit costs $27.99.'}},
    ]


def test_grounding_uses_only_context_the_final_model_received():
    request, answer, searches, final, context = evidence(captured_run())
    assert request == 'Find dinosaur toys under $25.'
    assert answer == 'The kit costs $27.99.'
    assert context == 'Kit: $27.99.'
    assert len(searches) == 1


def test_missing_context_is_an_error_not_a_grounding_failure():
    spans = captured_run()
    del spans[-1]['attributes']['llm.input_messages.2.message.content']
    with pytest.raises(ValueError, match='no captured product context'):
        evidence(spans)


def test_ambiguous_final_model_call_requires_review():
    spans = captured_run()
    spans.append(deepcopy(spans[-1]))
    with pytest.raises(ValueError, match='exactly one'):
        evidence(spans)
