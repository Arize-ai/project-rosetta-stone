const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

// The runner initializes model evaluators and calls main at module scope.
// Load the actual pure extractor without starting evaluations or needing keys.
const filename = path.join(__dirname, '../run-phoenix-evals.ts');
const source = ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true);
const extractor = source.statements.find((node) =>
  ts.isFunctionDeclaration(node) && node.name?.text === 'extractRootData');
assert.ok(extractor, 'The existing eval runner must expose its root extractor');
const compiled = ts.transpileModule(extractor.getText(source), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText;
const context = vm.createContext({});
vm.runInContext(compiled, context);
const extract = (span, all = []) => JSON.parse(JSON.stringify(context.extractRootData(span, all)));
const plain = (input, output) => ({ attributes: {
  'input.value': input, 'output.value': output,
  'input.mime_type': 'text/plain', 'output.mime_type': 'text/plain',
} });

test('new agent roots retain normal shopping text', () => {
  assert.deepEqual(extract(plain('Find dinosaur toys under $25', 'The kit costs $27.99.')), {
    userQuery: 'Find dinosaur toys under $25', agentResponse: 'The kit costs $27.99.',
  });
});

test('numeric shopper replies and answers remain text', () => {
  assert.deepEqual(extract(plain('25', '42')), { userQuery: '25', agentResponse: '42' });
});

test('JSON-looking plain text is not interpreted as framework messages', () => {
  assert.deepEqual(extract(plain('{"messages":[]}', 'null')), {
    userQuery: '{"messages":[]}', agentResponse: 'null',
  });
});

test('existing LangChain Python message payloads still work', () => {
  assert.deepEqual(extract({ attributes: {
    'input.value': JSON.stringify({ messages: [{ type: 'human', content: 'Old trace' }] }),
    'output.value': JSON.stringify({ messages: [{ type: 'ai', content: [{ type: 'text', text: 'Old answer' }] }] }),
  } }), { userQuery: 'Old trace', agentResponse: 'Old answer' });
});

test('HTTP roots still fall back to the framework child', () => {
  const root = { context: { trace_id: 'trace' }, attributes: {} };
  const child = { context: { trace_id: 'trace' }, span_kind: 'CHAIN', ...plain('Child request', 'Child answer') };
  assert.deepEqual(extract(root, [root, child]), { userQuery: 'Child request', agentResponse: 'Child answer' });
});

test('existing Mastra and Vercel payloads remain supported', () => {
  for (const output of ['"Answer"', '{"text":"Answer"}']) {
    assert.deepEqual(extract({ attributes: {
      'input.value': '[{"role":"user","content":"Request"}]', 'output.value': output,
    } }), { userQuery: 'Request', agentResponse: 'Answer' });
  }
});
