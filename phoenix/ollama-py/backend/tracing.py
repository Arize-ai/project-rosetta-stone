"""Phoenix tracing for Ollama. Import before ``ollama``."""
import os
from phoenix.otel import register
from openinference.instrumentation.ollama import OllamaInstrumentor

tracer_provider = register(project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-ollama-py"), protocol="http/protobuf", batch=True)
OllamaInstrumentor().instrument(tracer_provider=tracer_provider)
