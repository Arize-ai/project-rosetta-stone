ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))/..)
DEMO ?= langchain-py
PYTHON ?= 3.13
# Test versions exercise native SDK spans with an instrumentor that does not
# already suppress them. These pins do not change any demo's dependencies.
ANTHROPIC_VERSION ?= 1.17.0
OI_ANTHROPIC_VERSION ?= 3.0.0
.PHONY: help test-anthropic-telemetry
help:
	@echo 'make -f tests/Makefile test-anthropic-telemetry DEMO=langchain-py'
	@echo 'DEMOS: langchain-py agno-py haystack-py pydantic-ai-py crewai-py'

test-anthropic-telemetry:
	cd $(ROOT) && ROSETTA_TEST_DEMO=$(DEMO) uv run --no-project --python $(PYTHON) \
		--with-requirements phoenix/$(DEMO)/backend/requirements.txt \
		--with pytest --with arize-otel \
		--with 'anthropic==$(ANTHROPIC_VERSION)' \
		--with 'openinference-instrumentation-anthropic==$(OI_ANTHROPIC_VERSION)' \
		python -m pytest tests/test_anthropic_telemetry.py -q
