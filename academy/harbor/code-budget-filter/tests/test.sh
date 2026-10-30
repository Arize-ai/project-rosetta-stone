#!/bin/bash
set -eu
if PYTHONPATH=/app python /tests/check_filter.py; then
  echo 1 > /logs/verifier/reward.txt
else
  echo 0 > /logs/verifier/reward.txt
fi
