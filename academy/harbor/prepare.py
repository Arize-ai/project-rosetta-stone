"""Copy the current demo sources into the local Harbor build context."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).parent
out = HERE / "purchase-confirmed/environment"
source = ROOT / "phoenix/langchain-py/backend"
(out / "backend").mkdir(parents=True, exist_ok=True)
for name in ["__init__.py", "agent.py", "tracing.py", "tools.py", "inventory.py", "orders.py", "chroma_client.py", "products.json"]:
    shutil.copy2(source / name, out / "backend" / name)
shutil.copy2(source / "requirements.txt", out / "requirements.txt")
shutil.copy2(HERE / "runner.py", out / "runner.py")
shutil.copy2(source / "products.json", HERE / "code-budget-filter/environment/products.json")
print("Prepared the existing Wonder Toys backend for the local Harbor task. No credentials copied.")
