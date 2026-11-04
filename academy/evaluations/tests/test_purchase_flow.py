"""Check the real purchase tool in a process with fresh application state."""
import json
from pathlib import Path
import subprocess
import sys


def test_confirmed_cart_is_saved(tmp_path):
    artifact = tmp_path / 'purchase.json'
    result = subprocess.run([sys.executable, '-m', 'academy.evaluations.check_orders', '--output', str(artifact)],
                            cwd=Path(__file__).resolve().parents[3], capture_output=True, text=True, timeout=60)
    assert result.returncode == 0, result.stderr
    actual = json.loads(artifact.read_text())[0]
    assert actual['case'] == 'actual_order'
    assert actual['label'] == 'pass'
