---
name: test-coverage-checklist
description: How to keep vitest.config.mts's coverage tracking honest when adding or changing a test file in frankie-fit — add the source file to coverage.include, and how to mock the Supabase/OpenAI boundary the way frankie-orchestrator.test.ts does. Use this whenever you write a new test file, add meaningful test coverage to an existing file, or notice a source file with real tests that isn't showing up in coverage numbers.
---

# Test coverage checklist (frankie-fit)

`vitest.config.mts` only reports coverage for files listed in its `coverage.include` array — everything else is invisible to the coverage report even if it has real tests. That means a file can have a genuine, passing test suite and still silently not count toward coverage, which defeats the purpose of the coverage gate.

## When you add or change a test file

1. Open `vitest.config.mts` and check whether the source file under test is already in `coverage.include`.
2. If it isn't, add it. This is the step that's easy to forget, because tests pass either way — only the coverage report changes.
3. Re-run `pnpm test:coverage` and look at the reported percentages against the thresholds in `vitest.config.mts`'s `coverage.thresholds` block. Read those threshold numbers live from the file when you check this — they get ratcheted up over time, so don't assume today's numbers from memory or from an old conversation.
4. If the new baseline sits comfortably above the current thresholds, consider raising the threshold numbers to lock in the improvement rather than letting coverage quietly drift back down later.

## Mocking pattern

Test through the exported function, not through internals, and mock only the external boundary — Supabase and OpenAI calls — rather than mocking pieces of the module under test itself. `lib/ai/orchestrator/frankie-orchestrator.test.ts` shows the pattern for the OpenAI boundary:

```ts
const { hasOpenAiApiKey, createStructuredOpenAiResponse, createTextOpenAiResponse } = vi.hoisted(() => ({
  hasOpenAiApiKey: vi.fn(),
  createStructuredOpenAiResponse: vi.fn(),
  createTextOpenAiResponse: vi.fn()
}));

vi.mock("@/lib/ai/openai-responses", () => ({
  hasOpenAiApiKey,
  createStructuredOpenAiResponse,
  createTextOpenAiResponse
}));

async function importOrchestrator() {
  return import("./frankie-orchestrator");
}
```

`vi.hoisted` creates the mock functions before `vi.mock` needs to reference them, then each test sets `.mockResolvedValue`/`.mockImplementation` on the shared mock before dynamically importing the module under test. The same approach applies to a Supabase client boundary — hoist a mock client, `vi.mock` the module that constructs it, and let each test control what the client returns.

This keeps tests fast and focused on the logic actually being tested, rather than depending on network calls or a real database — and it means a test failure points at a real logic bug rather than a flaky external dependency.
