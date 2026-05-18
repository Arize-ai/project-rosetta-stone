# Frameworks Left to Add

Frameworks supported by Arize AX tracing that aren't yet implemented in this repo.

## Python

- [ ] Agno
- [ ] AutoGen
- [ ] AWS Strands
- [x] CrewAI
- [ ] DSPy
- [ ] Google ADK
- [ ] Haystack
- [ ] LlamaIndex Workflows
- [ ] Pipecat
- [x] Pydantic AI
- [ ] Semantic Kernel
- [ ] Smolagents (Hugging Face)
- [ ] BeeAI

## TypeScript

- [ ] BeeAI

## Borderline — decide before building

Have Arize tracing support but are utility libraries / wire protocols / LLM providers rather than agent frameworks. May not fit the Wonder Toys comparison goal:

- [ ] Guardrails AI (output validation)
- [ ] Instructor (structured output)
- [ ] MCP / Model Context Protocol (wire protocol)
- [ ] Portkey (LLM gateway)
- [ ] Together AI (LLM provider)

## Already covered transitively

- LangGraph — already used inside `langchain-py` via the ReAct agent
