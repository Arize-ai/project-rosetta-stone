"""Phoenix tracing for AG2. Import before ``autogen``."""
import os
from phoenix.otel import register
from openinference.instrumentation.ag2 import AG2Instrumentor
from openinference.instrumentation.openai import OpenAIInstrumentor

tracer_provider = register(project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-ag2-py"), protocol="http/protobuf", batch=True)
AG2Instrumentor().instrument(tracer_provider=tracer_provider)
OpenAIInstrumentor().instrument(tracer_provider=tracer_provider)
