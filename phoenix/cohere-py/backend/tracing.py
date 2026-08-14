"""Phoenix tracing for Cohere v2. Import before ``cohere``."""
import os
from phoenix.otel import register
from openinference.instrumentation.cohere import CohereInstrumentor

tracer_provider = register(project_name=os.environ.get("PHOENIX_PROJECT_NAME", "wonder-toys-cohere-py"), protocol="http/protobuf", batch=True)
CohereInstrumentor().instrument(tracer_provider=tracer_provider)
