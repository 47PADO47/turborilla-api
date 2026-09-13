# Project Overview

`turborilla` is an unofficial, typed API wrapper for [Turborilla](https://turborilla.com)'s games (Mad Skills Motocross 2 and Mad Skills BMX 2). It wraps the backend HTTP API and the assets CDN behind promise-based clients. See [README.md](README.md) for user-facing docs.

## Structure

- `src/index.ts` — public entry point: named exports (`MX2`, `BMX2`, `Assets`, `TurborillaClient`, `TurborillaError`, game definitions, types) and a default export `{ mx2, bmx2 }` of stateless clients marked `#__PURE__`.
- `src/client.ts` — `TurborillaClient<TGame, TCredentials>`: options, the protected `resolve`/`call`/`request` helpers and every shared endpoint.
- `src/assets.ts` — `Assets` client for the CDN (`dnzcutqlxlufn.cloudfront.net/dlc/`): URL builders, JSON manifests, binary downloads.
- `src/envelope.ts` — pure `buildEnvelope`/`encodeBody` (the `json=` form body).
- `src/errors.ts` — `TurborillaError` with a `code` discriminant.
- `src/constants.ts` — base URLs, headers and envelope defaults captured from the app.
- `src/games/definition.ts` — `GameDefinition` contract and the shared `getUserData` sections; `games/mx2.ts` and `games/bmx2.ts` hold one definition plus one class each.
- `src/types/` — `credentials.ts` (the `CallArgs` machinery), `response.ts` (`ApiResponse`), `endpoints.ts` (params interfaces), `assets.ts`.
- `tests/` — bun tests; `fetch-mock.ts` builds an injectable `fetch`. `types.test.ts` holds compile-time contracts checked by `bun run typecheck`.
- `scripts/` — runnable examples that write to `dist/`.

## Design rules

- **Credentials generic.** `TCredentials` records whether credentials were bound in the constructor. Endpoint methods are declared as `...args: CallArgs<TCredentials, Access, Params>`; inside the class that tuple is deferred, so methods never destructure `args` themselves. They go through `this.call<Params>(path, access, args)` or `this.resolve<Params>(args, access)`, which holds the single `as` cast.
- **Access.** `"public"` endpoints never need credentials (they are forwarded when present); `"user"` endpoints throw `MISSING_CREDENTIALS` without bound or per-call credentials. Guest requests carry no `userId` at all (verified against captured traffic).
- **Params objects only**, PascalCase `XxxParams` interfaces, `credentials` and `signal` are stripped before the payload is sent.
- **No type parameters on endpoint methods.** Only `request`/`call` are generic; unknown response fields are read through the string index signature (bracket access).
- **Adding a game** = a `GameDefinition` const + a thin subclass. **Adding an endpoint** = one method calling `this.call`.
- Logging is an optional `@padosoft/logger` instance; there is no `debug` flag.
- Prefer `interface`s over object `type` aliases; lowercase filenames; no apostrophes needed anywhere.

## Tooling

- **Runtime/package manager:** Bun.
- **Build:** [tsdown](https://tsdown.dev) (`bun run build` → `dist/`, one file per source module), configured via the `@padosoft/config` tsdown factory in `tsdown.config.ts`. The `exports` map exposes `.`, `./mx2`, `./bmx2` and `./assets`.
- **TypeScript:** v7, extending `@padosoft/config/typescript/base-ts7` (strict, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `erasableSyntaxOnly`).
- **Type-check:** `bun run typecheck` (covers `src`, `tests` and the example scripts).
- **Test:** `bun test`.
- **Lint/format:** Ultracite (Oxlint + Oxfmt); a Husky pre-commit hook runs `bun ultracite fix` and blocks commits on unfixable issues.

---

# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `bun ultracite fix`
- **Check for issues**: `bun ultracite check`
- **Diagnose setup**: `bun ultracite doctor`

Oxlint + Oxfmt (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**

- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**

- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**

- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Oxlint + Oxfmt Can't Help

Oxlint + Oxfmt's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Oxlint + Oxfmt can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Oxlint + Oxfmt. Run `bun ultracite fix` before committing to ensure compliance.
