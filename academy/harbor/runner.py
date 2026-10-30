"""Run the original application and save actual order state plus an ATIF trajectory."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
from uuid import uuid4

p = argparse.ArgumentParser()
p.add_argument('--instruction')
p.add_argument('--oracle', action='store_true')
args = p.parse_args()
from backend import tracing
from backend.orders import get_orders_by_user
from backend.tools import purchase_product

if args.oracle:
    purchase_product.invoke({'user_id': 'academy-shopper', 'items': [{'productId': 'toy-051', 'quantity': 1}],
                             'shipping_address': {'name': 'Demo Shopper', 'street': '123 Example Street', 'city': 'Example City', 'state': 'CA', 'zip': '00000', 'country': 'US'}})
else:
    from backend.agent import _build_agent, _lc_messages, SYSTEM_PROMPT
    from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
    from langchain_core.utils.function_calling import convert_to_openai_tool
    from backend.tools import all_tools
    if not args.instruction:
        raise ValueError('Missing shopper instruction')
    agent = _build_agent()
    messages = _lc_messages([{'role': 'user', 'content': args.instruction}], 'academy-shopper')
    steps = [{'step_id': 1, 'source': 'system', 'message': SYSTEM_PROMPT},
             {'step_id': 2, 'source': 'user', 'message': messages[0].content}]
    seen = len(messages)
    call_steps = {}
    for state in agent.stream({'messages': messages}, config={'recursion_limit': 25}, stream_mode='values'):
        for msg in state['messages'][seen:]:
            if isinstance(msg, AIMessage):
                content = msg.content if isinstance(msg.content, str) else ''.join(b.get('text','') for b in msg.content if isinstance(b,dict) and b.get('type') == 'text')
                step = {'step_id': len(steps)+1, 'source': 'agent', 'message': content,
                        'timestamp': datetime.now(timezone.utc).isoformat(), 'model_name': 'claude-sonnet-4-6'}
                if msg.tool_calls:
                    step['tool_calls'] = [{'tool_call_id': c['id'], 'function_name': c['name'], 'arguments': c['args']} for c in msg.tool_calls]
                    for c in msg.tool_calls: call_steps[c['id']] = step
                if msg.usage_metadata:
                    step['metrics'] = {'prompt_tokens': msg.usage_metadata.get('input_tokens',0), 'completion_tokens': msg.usage_metadata.get('output_tokens',0)}
                steps.append(step)
            elif isinstance(msg, ToolMessage):
                step = call_steps[msg.tool_call_id]
                step.setdefault('observation',{'results': []})['results'].append({'source_call_id': msg.tool_call_id, 'content': msg.content if isinstance(msg.content,str) else json.dumps(msg.content)})
        seen = len(state['messages'])
    trajectory = {'schema_version': 'ATIF-v1.7', 'session_id': str(uuid4()),
                  'agent': {'name': 'wonder-toys', 'version': 'academy-local', 'model_name': 'claude-sonnet-4-6',
                            'tool_definitions': [convert_to_openai_tool(t) for t in all_tools]}, 'steps': steps,
                  'notes': 'Messages and tool results captured from the existing LangGraph agent. Step timestamps mark when messages were observed, not operation start times.'}
    Path('/logs/agent').mkdir(parents=True,exist_ok=True)
    Path('/logs/agent/trajectory.json').write_text(json.dumps(trajectory,indent=2))

# This snapshot is written by the application runner, not supplied by the model.
Path('/app/order-state.json').write_text(json.dumps({'orders': get_orders_by_user('academy-shopper')},indent=2))
