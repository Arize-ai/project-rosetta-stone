"""Run the local Wonder Toys Harbor exercise and record it in local Phoenix."""
import argparse
import os
from pathlib import Path
import subprocess
import sys
from dotenv import dotenv_values

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--env-file', type=Path)
p.add_argument('--phoenix-url', default='http://localhost:6006')
p.add_argument('--task', choices=['purchase-confirmed', 'code-budget-filter'], default='purchase-confirmed')
p.add_argument('--agent', choices=['wonder-toys', 'claude-code', 'oracle', 'nop'], default='wonder-toys')
args = p.parse_args()
env = os.environ.copy()
env['PYTHONPATH'] = str(Path(__file__).resolve().parents[2]) + os.pathsep + env.get('PYTHONPATH', '')
env['PHOENIX_COLLECTOR_ENDPOINT'] = args.phoenix_url
if args.agent in {'wonder-toys', 'claude-code'} and not env.get('ANTHROPIC_API_KEY'):
    key = dotenv_values(args.env_file).get('ANTHROPIC_API_KEY') if args.env_file else None
    if not key: raise ValueError('Set ANTHROPIC_API_KEY or pass --env-file')
    env['ANTHROPIC_API_KEY'] = key
suffix = 'purchase-check' if args.task == 'purchase-confirmed' else args.task
agent = 'academy.harbor.adapter:WonderToysAgent' if args.agent == 'wonder-toys' else args.agent
command = [str(Path(sys.executable).with_name('harbor')), 'run', '-p', f'academy/harbor/{args.task}',
           '-a', agent, '--plugin', 'arize-phoenix', '--plugin-kwarg', f'experiment_name={args.agent}-{suffix}',
           '--jobs-dir', 'academy/harbor/jobs', '--yes']
if args.task == 'purchase-confirmed': command += ['--artifact', '/app/order-state.json']
if args.agent == 'claude-code': command += ['-m', 'anthropic/claude-sonnet-4-6', '--artifact', '/app/budget_filter.py']
if args.agent in {'oracle', 'nop'}: command += ['--plugin-kwarg', 'trace_mode=null']
subprocess.run(command, env=env, check=True)
