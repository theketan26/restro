# Agent Prompt Examples — Desktop App

Purpose
- Provide quick, repeatable prompt templates and short "do / don't" rules to guide the assistant when working on the desktop app (Tauri + Next + Tailwind + IndexedDB via `idb`).

Positive Examples (what to ask the assistant)
- "Create a typed repository in `infrastructure/db` using `idb` to persist `User` records. Use named exports and return `domain/models/user` instances." 
- "Refactor `infrastructure/db/user-repository.ts` to map raw DB rows to `User` domain objects and translate errors to `domain/errors`." 
- "Implement a `useUsers()` React hook that uses the typed repository, returns `{ data, loading, error }`, and does not expose IndexedDB details to components." 
- "Add a small `tauri` client wrapper isolated from UI code for invoking a native API; keep it under `src-tauri` and export named functions." 

Negative Examples (what not to do)
- "Directly access IndexedDB in UI components — avoid this." 
- "Use `any` for domain models or repository return types without clear TODOs." 
- "Scatter Tauri/native calls across components instead of centralizing them in a wrapper." 
- "Apply broad global CSS overrides instead of Tailwind utilities or co-located component styles." 

Short Templates
- Repository creation:

  - Task: "Create a typed repository for <Model> in `infrastructure/db` using `idb` with `getAll`, `getById`, `add`, `update`, `delete`. Use named exports and map DB rows to `domain/models/<model>`." 

- Hook creation:

  - Task: "Create `use<Models>()` hook that returns `{ data, loading, error, refresh }` and calls the repository methods. Keep IndexedDB logic in the repository."

Micro-rules for prompts
- Always mention: scope (`desktop/` and `src-tauri/`), `idb` for IndexedDB, and named exports preference.
- When requesting code changes, specify whether to include tests; by default tests are ignored.

Quick checks the assistant should run before responding
- Confirm the target file path and named export names.
- Confirm domain model shape lives in `domain/models` and reuse it.

If you want, ask: "Scaffold the repository for `User` now" to trigger code generation.
