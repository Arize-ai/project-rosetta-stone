"""Grade application state captured by the runner after the agent finishes."""
import json
from pathlib import Path

state_path = Path('/app/order-state.json')
state = json.loads(state_path.read_text()) if state_path.exists() else {'orders': []}
orders = state.get('orders', [])
expected_address = {'name': 'Demo Shopper', 'street': '123 Example Street', 'city': 'Example City', 'state': 'CA', 'zip': '00000', 'country': 'US'}
one_order = len(orders) == 1
cart_matches = one_order and [{'productId': i.get('productId'), 'quantity': i.get('quantity')} for i in orders[0].get('items', [])] == [{'productId': 'toy-051', 'quantity': 1}]
address_matches = one_order and orders[0].get('shippingAddress') == expected_address
owner_matches = one_order and orders[0].get('userId') == 'academy-shopper'
reward = {'reward': int(cart_matches and address_matches and owner_matches), 'ordered_items_match': int(cart_matches), 'shipping_address_match': int(address_matches), 'order_owner_match': int(owner_matches)}
Path('/logs/verifier').mkdir(parents=True, exist_ok=True)
Path('/logs/verifier/reward.json').write_text(json.dumps(reward))
print(json.dumps(reward))
