"""Arize AX tracing for Cohere v2. Import before ``cohere``."""
import os
from arize.otel import register
from openinference.instrumentation.cohere import CohereInstrumentor

tracer_provider = register(space_id=os.environ.get("ARIZE_SPACE_ID", ""), api_key=os.environ.get("ARIZE_API_KEY", ""), project_name=os.environ.get("ARIZE_PROJECT_NAME", "wonder-toys-cohere-py"))
CohereInstrumentor().instrument(tracer_provider=tracer_provider)
