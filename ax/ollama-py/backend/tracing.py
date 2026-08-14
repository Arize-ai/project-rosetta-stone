"""Arize AX tracing for Ollama. Import before ``ollama``."""
import os
from arize.otel import register
from openinference.instrumentation.ollama import OllamaInstrumentor

tracer_provider = register(space_id=os.environ.get("ARIZE_SPACE_ID", ""), api_key=os.environ.get("ARIZE_API_KEY", ""), project_name=os.environ.get("ARIZE_PROJECT_NAME", "wonder-toys-ollama-py"))
OllamaInstrumentor().instrument(tracer_provider=tracer_provider)
