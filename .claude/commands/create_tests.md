---
description: Create or update tests for recent changes using existing patterns and test suites
model: sonnet
---

# Test Suite Creation & Expansion

You are tasked with designing and implementing tests for a specific change-set, feature, or set of files. You should be **pattern-driven**, **context-aware**, and **ruthlessly aligned** with the existing test suite and conventions.

Your primary goals:

- Identify *where* and *how* tests are currently written
- Infer *what* needs to be tested based on recent changes or user-specified features
- Propose a clear **test strategy and coverage plan**
- Then **implement or update tests** following existing patterns as much as possible
- If no patterns exist, propose a sensible testing approach for this codebase

## Initial Response

When `/create_tests` is invoked, always:

1. **Check for parameters / explicit scope**  
   Look for any of the following in the invocation or surrounding context:
   - File paths or directories (e.g. `src/api/user.ts`, `packages/app/`)
   - A feature / ticket description
   - An explicit branch or diff reference
   - A previously mentioned implementation command/plan

   If any are present:
   - Treat them as the primary scope
   - **Do not** ask the user to restate them
   - Begin your research and discovery immediately

2. **If no explicit scope is provided**, attempt **automatic scope detection**:

   In order:

   1. **Same-session implementation context**  
      - If this command follows an implementation-focused command (e.g. `/implement`, `/create_plan`, or a recent coding session), infer scope from:
        - The files that were just edited/generated
        - The feature / ticket that was just discussed

   2. **Git diff–based scope (if tools are available)**  
      - Use the shell / git tool (if available) to run:
        - `git status`
        - `git diff HEAD` (or similar)
      - Identify:
        - Files with staged changes
        - Files with unstaged changes
      - Filter out non-code/obviously non-testable files (e.g. images, lockfiles, markdown unless explicitly relevant)

   3. **If you still cannot infer a clear scope**, respond with:

   ```text
   I'll help you design and implement tests, but I need to know what we're targeting.

   I can:
   - Infer tests for the current git diff (changed files)
   - Focus on specific files or directories
   - Target a particular feature / ticket

   Please choose one:
   1) "Use the current git diff"
   2) "Target these files: `path/to/file1.ts`, `path/to/file2.tsx`"
   3) "Target this feature / ticket: <short description or ticket ref>"
   ```

3. **If parameters *are* provided and scope is clear**, respond with something like:

   ```text
   Got it — I'll design and implement tests for:

   - [List files/features/ticket you inferred]

   I'll first:
   - Discover the existing test infrastructure and patterns
   - Map your changes to the right types of tests
   - Propose a coverage plan
   - Then implement or update the tests according to existing patterns

   Let me start by analyzing the codebase and existing tests.
   ```

Then immediately move into discovery and analysis.

## Process Steps

### Step 1: Context & Change Analysis

1. **Identify the implementation surface area**:
    - Ticket files (e.g., `thoughts/name/tickets/eng_1234.md`)
    - Research documents
    - Related implementation plans
    - Any JSON/data files mentioned
   - **IMPORTANT**: Prefer full reads, but for very large files start with a quick scoped read/summary (top-level structure, key exports) before deep-diving relevant sections with full reads.
   - **CRITICAL**: Build a baseline understanding yourself first; use agents as optional accelerators when you need speed or extra coverage, not as mandatory gates.
   - Use the **codebase-locator** agent to find related files/tests/configs when discovery would be slow manually.
   - Use the **codebase-analyzer** agent to trace complex implementations after you have an initial grasp.
   - If relevant, use the **thoughts-locator** agent to find any existing thoughts documents about this feature.
   - If a Linear ticket is mentioned, use the **linear-ticket-reader** agent to get full details.
     * Spawn sub-tasks only after you have a basic direct view of the core implementation files or when they materially speed up discovery.

  These agents will:
   - Find relevant source files, configs, and tests
   - Identify the specific directories to focus on
   - Trace data flow and key functions
   - Return detailed explanations with file:line references

2. **Read all files identified by research tasks**:
   - Read relevant implementation files FULLY. For generic utility files, large data mocks, or config files > 500 lines, read only the interface/exports first. Only read the full implementation if the test logic depends on the internal mechanics.
   - This ensures you have complete understanding before proceeding

3. **Quick tooling detection**:
   - Detect package manager and test runner from lockfiles/configs (`pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `jest.config.*`, `vitest.config.*`, `go.mod`, `pytest.ini`, etc.).
   - Note the likely commands for later (e.g., `pnpm test`, `yarn test`, `npm test`, `go test ./...`, `pytest`).

4. **Summarize your understanding of what changed / what needs testing**:

   * Do this before you talk about tests
   * Capture:

     * Primary behaviors
     * Important branching logic
     * Error and edge cases
     * Invariants and contracts

   Example:

   ```text
   From the implementation, I understand we have:

   - A new endpoint: `POST /api/users/invite` in `apps/api/src/routes/users.ts`
   - It:
     - Validates input (email, role)
     - Creates an invite token
     - Sends an email
     - Returns 201 with invite metadata

   Key behaviors and branches:
   - Valid vs invalid input (missing email, invalid email, disallowed role)
   - Success vs downstream failures (DB insertion error, email provider failure)
   - Permissions: only admins can call this endpoint
   ```

5. **Present informed understanding and focused questions**:
   ```text
   Based on the ticket and my research of the codebase, I understand we need to [accurate summary].

   I've found that:
   - [Current implementation detail with file:line reference]
   - [Relevant pattern or constraint discovered]
   - [Potential complexity or edge case identified]

   Questions that my research couldn't answer:
   - [Specific technical question that requires human judgment]
   - [Business logic clarification]
   - [Design preference that affects implementation]
   ```

   Only ask questions that you genuinely cannot answer through code investigation.

### Step 2: Discover Test Infrastructure & Patterns

Your next focus is to **understand how this codebase already does testing**.

1. **Locate existing test suites** using `codebase-locator`:

   * Look for common patterns:

     * Directories: `__tests__`, `tests`, `spec`, `integration-tests`, `e2e`, etc.
     * File suffixes: `.test.ts`, `.spec.ts`, `.test.js`, `.spec.rb`, `_test.go`, etc.
     * Config files: `jest.config.*`, `vitest.config.*`, `pytest.ini`, `tox.ini`, `rspec`, `go.mod`/`*_test.go`, `cypress.config.*`, etc.
   * Identify whether:

     * There are **multiple** test layers (unit, integration, e2e)
     * There are **per-package** testing patterns in a monorepo

2. **Use `codebase-pattern-finder` to discover concrete examples**:

   * Ask it for:

     * “Tests for similar modules/components”
     * “Tests that exercise similar flows”
     * “Tests for this router/controller/service pattern”
   * The goal is to:

     * Find *canonical* examples of how this codebase tests things
     * Extract conventions:

       * Naming
       * Fixture / factory usage
       * Mocking approach
       * Test data builders
       * How async, time, and external services are handled

3. **Read representative test files FULLY**:

   * At least:

     * 1–3 unit tests relevant to the same tech stack (e.g. React components, API handlers, database layer)
     * 1–2 integration/e2e tests if present
   * Understand:

     * Setup/teardown patterns
     * Test runner APIs and helpers
     * How environment / config is loaded
     * How snapshots (if any) are used

4. **Summarize the testing ecosystem**:

   ```text
   Here's the existing test setup I found:

   - Unit tests:
     - Framework: Jest + Testing Library
     - Structure: `apps/web/src/**/__tests__/*.test.tsx`
     - Helpers: `apps/web/test-utils/renderWithProviders.tsx`

   - API tests:
     - Framework: Jest (supertest)
     - Location: `apps/api/tests/*.test.ts`
     - Convention: one test file per route module

   - Integration tests:
     - Framework: Vitest
     - Location: `packages/core/tests/integration/*.test.ts`
     - Uses a real Postgres test DB seeded via `tests/fixtures/seed.ts`

   Patterns we'll follow:
   - Use existing test utils from `[path]`
   - Co-locate new tests in `[directory structure]`
   - Mirror file naming: `[implementation].test.ts`
   ```

5. **If infrastructure exists but is bad/deprecated**:

   * If existing patterns utilize deprecated libraries or are explicitly marked as 'legacy', highlight this to the user and propose the modern standard (e.g., Testing Library) alongside the legacy option.

6. **If no test infrastructure is found**:

   * Do **not** panic — propose a reasonable starting strategy based on stack:

     * For Node/TS: Vitest or Jest
     * For Go: `_test.go` with `testing` package
     * For Python: `pytest`
     * For Rails: RSpec
   * Suggest:

     * Minimal configuration
     * Directory structure
     * Initial commands to run tests
   * **Ask the user** before creating a brand-new test stack:

     * Present 1–2 options with pros/cons tailored to this repo.

### Step 3: Test Strategy & Coverage Plan

Once you understand both **implementation** and **test patterns**, define a clear test plan.

1. **Map behaviors → test cases**:

   * For each function/endpoint/component:

     * List:

       * Happy-path scenarios
       * Edge cases
       * Error paths
       * Permission / auth variants
       * Important integration boundaries

2. **Decide test types per behavior**:

   * Unit vs integration vs e2e
   * Example mapping:

   ```text
   - Input validation → unit tests for schema/handler
   - Permission checks → unit tests on guard / middleware
   - DB interactions → integration tests (with test DB or transactional tests)
   - Full user flow → e2e or high-level integration test
   ```

3. **Present a concise test plan**:

If the scope is small and patterns are clear, present the plan and immediately proceed to implementation in the same response. Only pause for user approval if you are proposing a new test framework, a major refactor, or if the requirements are ambiguous:

   ```markdown
   ## Proposed Test Plan

   We'll add/update tests in:

   - `apps/api/tests/users.invite.test.ts`
   - `apps/web/src/pages/InviteUser/__tests__/InviteUserPage.test.tsx`

   ### API: POST /api/users/invite

   - [ ] Returns 201 for valid input
   - [ ] Rejects missing email with 400
   - [ ] Rejects invalid email format with 400
   - [ ] Rejects disallowed role with 403
   - [ ] Returns 403 for non-admin caller
   - [ ] Handles DB errors with 500
   - [ ] Handles email provider failure with 502

   ### UI: InviteUserPage

   - [ ] Renders form with expected fields
   - [ ] Shows validation error messages on invalid input
   - [ ] Calls API with correct payload on submit
   - [ ] Shows success state after successful invite
   - [ ] Shows error toast on API error
   ```

4. **Ask for alignment only if something is ambiguous or high-impact**, e.g.:

   * “Should we cover full e2e in Cypress or keep this at API + UI integration level?”

### Step 4: Test File Location & Structure

After the plan is agreed or if ambiguity is low:

1. **Determine where tests should live**:

   * Prefer **existing conventions**:

     * Co-located `__tests__` directories
     * Mirrored `tests/` vs `src/` tree
     * Package-local `tests` folders in monorepos
   * If multiple patterns exist:

     * Prefer the one used by files **closest** to the target implementation
     * If there’s still ambiguity, briefly note the conflict and choose the **most recent** or **most actively used** pattern (e.g., by file timestamps or frequency if available).

2. **Name test files following existing patterns**:

   * Examples:

     * `src/user/service.ts` → `src/user/service.test.ts`
     * `apps/web/src/pages/InviteUser/index.tsx` → `apps/web/src/pages/InviteUser/__tests__/InviteUserPage.test.tsx`

3. **When no obvious place exists**:

   * Propose:

     * A sensible location
     * How it aligns with any nearby patterns
   * Example:

   ```text
   There is no existing test directory for `apps/tools/`. The nearest pattern is:

   - `apps/api/tests/*.test.ts` for app-level code

   Proposal:
   - Create `apps/tools/tests/` for this tool
   - Use the same Jest config as `apps/api/tests`
   ```

### Step 5: Test Implementation

Now implement or update tests. Before mocking a dependency, verify its actual public interface. Do not assume a method exists just because it fits the context. If mocking a 3rd party library, check how it is mocked in other tests (e.g., jest.mock vs dependency injection).

1. **Use `codebase-pattern-finder` for concrete examples**:

   * Especially for:

     * Test Data Factories or fixtures (e.g., `UserFactory.create()`); prefer them over hand-built large objects.
     * If no factory exists and you must build objects manually, find and reuse the "minimal valid object" pattern from nearby tests to avoid irrelevant properties.
     * Test utilities (render helpers, DB helpers)
     * Mocking patterns (e.g. `jest.mock`, `vi.mock`, HTTP mocking libraries)
     * Snapshot usage

2. **Write tests that match the project’s style**:

   * Follow:

     * Naming conventions (`it("does something")`, `test("...", ...)`)
     * Assertion style (`expect(...).toEqual(...)`, `toMatchObject`, etc.)
     * Fixture / factory patterns
     * Given-when-then or arrange-act-assert structure if that’s the norm

3. **Prefer small, focused tests**:

   * Each test should:

     * Assert a specific behavior
     * Be deterministic
     * Avoid unnecessary network/IO when mocking is the standard.

4. **Extend existing tests when appropriate**:

   * Before creating new files, check whether:

     * There is an existing test file that already covers related behavior
   * When appropriate:

     * Add new test cases to existing files
     * Update existing assertions to reflect new behavior
     * Avoid creating parallel or duplicate test suites.

5. **Document non-obvious setups inside the test file**:

   * Brief comments are OK when:

     * There is subtle mocking logic
     * Integration setup is non-trivial
     * Certain test decisions are trade-offs

---

### Step 6: Running Tests & Success Criteria

Always close the loop with **clear commands** and **success criteria**.

1. **Identify how to run relevant tests**:

   * From `package.json` / makefiles / scripts:

     * `npm test`, `pnpm test`, `yarn test`
     * `npm run test:unit`, `test:integration`, etc.
     * `go test ./...`
     * `pytest`
   * Prefer the **most targeted** commands that cover the affected suite.

2. **Propose explicit success criteria**:

   ```markdown
   ### Test Success Criteria

   #### Automated Verification:
   - [ ] New/updated tests compile and run
   - [ ] Targeted tests pass:
     - `cd apps/api && pnpm test users.invite.test.ts`
   - [ ] Full CI-equivalent suite passes (if reasonable):
     - `pnpm test` at repo root
     - `pnpm lint` / `pnpm typecheck` if relevant to test changes

   #### Manual Verification (if UI-related):
   - [ ] Run the app and manually exercise the flow:
     - Start dev server: `pnpm dev`
     - Navigate to `/admin/invite-user`
   - [ ] Confirm UI behavior matches expectations (success & error states)
   ```

3. **If introducing new test infrastructure**, add:

   ```markdown
   Additional one-time verification:
   - [ ] New test runner/config is recognized by CI
   - [ ] Test commands documented (e.g. in README or CONTRIBUTING)
   ```

---

## Important Guidelines

1. **Pattern First, Novelty Last**

   * Always prefer **existing patterns** over inventing new ones
   * If you must deviate, explain why and keep it minimal

2. **Be Honest About Coverage**

   * Don’t claim “fully covered” unless it truly is
   * If some scenarios are expensive/complex to test:

     * Acknowledge them
     * Suggest how they *could* be tested later
     * Focus current work on high-value coverage

3. **Stay Incremental**

   * It’s okay to:

     * Start with unit tests
     * Add deeper integration or e2e tests in follow-up passes
   * But be explicit about what is and isn’t covered **now**.

4. **Avoid Flaky Tests**

   * Be cautious with:

     * Uncontrolled time
     * Network calls
     * Shared global state
   * Use:

     * Mocks
     * Test DB transactions
     * Stable seeds
     * Retries only when absolutely necessary (and explain why)

5. **Keep Tests Readable**

   * Prioritize clarity:

     * Descriptive test names
     * Clear arrange/act/assert sections
     * Minimal indirection

---

## Sub-agent Usage Best Practices

Use the agents strategically:

* **`codebase-locator`**

  * To find:

    * Implementation files
    * Existing tests
    * Test helpers
    * Config files and scripts

* **`codebase-analyzer`**

  * To:

    * Understand complex implementations
    * Trace data flows and dependencies
    * Identify side effects and integration points

* **`codebase-pattern-finder`**

  * To:

    * Find “similar feature” tests
    * Extract idiomatic test examples
    * Learn how mocks/fixtures are typically set up

When spawning multiple sub-tasks:

1. Keep each prompt focused:

   * “Find tests for API endpoints in `apps/api` similar to `users.ts`”
   * “Show me 3 representative tests for React pages using `renderWithProviders`”

2. Request:

   * File paths
   * Short explanations
   * Concrete code snippets where helpful

3. Always **verify** sub-agent outputs by reading the referenced files yourself before copying patterns.

---

## Example Interaction Flow

```text
User: /create_tests

Assistant:
I'll help you design and implement tests for your recent changes.

I can:
- Infer tests from your current git diff
- Target specific files/directories
- Or focus on a particular feature/ticket

Would you like me to:
1) Use the current git diff
2) Target specific files
3) Target a feature/ticket description?

---

User: Use the current git diff.

Assistant:
Great — I'll:
- Inspect the current diff to find changed files
- Discover existing tests and patterns for those areas
- Propose a test coverage plan
- Then implement or update tests accordingly

[Runs analysis with codebase-locator, codebase-analyzer, and codebase-pattern-finder, reads relevant files, summarizes implementation, discovers test infra, proposes plan, then writes tests and provides commands + success criteria.]
```
