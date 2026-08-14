"""Arize AX tracing for AG2. Import before ``autogen``."""
import os
from arize.otel import register
from openinference.instrumentation.ag2 import AG2Instrumentor
from openinference.instrumentation.openai import OpenAIInstrumentor

tracer_provider = register(space_id=os.environ.get("ARIZE_SPACE_ID", ""), api_key=os.environ.get("ARIZE_API_KEY", ""), project_name=os.environ.get("ARIZE_PROJECT_NAME", "wonder-toys-ag2-py"))
AG2Instrumentor().instrument(tracer_provider=tracer_provider)
OpenAIInstrumentor().instrument(tracer_provider=tracer_provider)
