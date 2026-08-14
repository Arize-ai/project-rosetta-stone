"""Arize AX tracing for Together AI. Import before ``together``."""
import os
from arize.otel import register
from openinference.instrumentation.together import TogetherInstrumentor

tracer_provider = register(space_id=os.environ.get("ARIZE_SPACE_ID", ""), api_key=os.environ.get("ARIZE_API_KEY", ""), project_name=os.environ.get("ARIZE_PROJECT_NAME", "wonder-toys-together-ai-py"))
TogetherInstrumentor().instrument(tracer_provider=tracer_provider)
