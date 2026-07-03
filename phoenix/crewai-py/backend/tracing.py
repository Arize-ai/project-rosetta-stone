"""Phoenix tracing initialization.

This module MUST be imported before any crewai imports so that the
CrewAI instrumentor can patch CrewAI's internals.

Expects these environment variables:
  PHOENIX_COLLECTOR_ENDPOINT — Phoenix base URL
  PHOENIX_API_KEY            — Phoenix API key (read automatically by phoenix-otel)
  PHOENIX_PROJECT_NAME       — Project name in Phoenix
"""

import importlib.metadata
import importlib.util
import os
import sys
from pathlib import Path

from openinference.instrumentation.crewai import CrewAIInstrumentor


def _load_phoenix_otel_register():
    """Load arize-phoenix-otel without importing the full phoenix server package."""
    distribution = importlib.metadata.distribution("arize-phoenix-otel")
    module_path = Path(distribution.locate_file("phoenix/otel/__init__.py"))
    spec = importlib.util.spec_from_file_location(
        "_arize_phoenix_otel",
        module_path,
        submodule_search_locations=[str(module_path.parent)],
    )
    if spec is None or spec.loader is None:
        raise ImportError(f"Could not load phoenix.otel from {module_path}")

    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module.register


register = _load_phoenix_otel_register()

_tracer_provider = register(
    endpoint=os.environ.get("PHOENIX_COLLECTOR_ENDPOINT"),
    project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-crewai-py"),
)

CrewAIInstrumentor().instrument(tracer_provider=_tracer_provider)
