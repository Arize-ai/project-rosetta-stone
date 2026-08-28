"""Phoenix tracing for Together AI. Import before ``together``."""
import os
from phoenix.otel import register
from openinference.instrumentation.together import TogetherInstrumentor

tracer_provider = register(project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-together-ai-py"), protocol="http/protobuf", batch=True)
TogetherInstrumentor().instrument(tracer_provider=tracer_provider)
