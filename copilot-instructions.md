# Copilot / Agent Instructions — Stackrise Monorepo

## Purpose
- Provide persistent guidance for the assistant when authoring, refactoring, and reviewing code for both the desktop and mobile applications.

## Scope & Frameworks
- **Desktop Application** (`desktop/`, `src-tauri/`): Next.js (app router), Tauri, Tailwind CSS, IndexedDB.
- **Mobile Application** (`mobile/`): React Native, Expo, Tailwind (or styled components), AsyncStorage, TanStack Query, Axios.

---

## Desktop Rules
- Use TypeScript with strict types where practical. Prefer explicit types for public interfaces.
- Follow existing project layout: domain models in `domain/models`, repositories in `infrastructure/db`, and commands/queries under `commands/` and `queries/`.
- UI components: use React functional components and hooks. Prefer small, testable components.
- API access in desktop: when data must be fetched from a backend, use the CQRS query layer and the state returned by the query hook (loading, error, data) instead of calling APIs directly from components. Follow the pattern in `desktop/src/queries/user/use-users.query.ts`.
- HTTP client: use the shared `httpClient` exported from `desktop/src/infrastructure/http/axios-client.ts` for all API requests. Do not use the Fetch API directly for desktop app API calls.
- Styling: use Tailwind utility classes for layout and design; avoid large global CSS overrides. Keep component-specific styles co-located where needed.
- Persistence: use IndexedDB (via an explicit wrapper like `idb` or a typed helper). Encapsulate DB logic in repository classes under `infrastructure/db` and expose async methods returning typed domain models.
- Tauri bridge: isolate all Tauri/native interactions in `src-tauri` or a dedicated `tauri/` client wrapper so UI code remains testable.
- Repos & commands: prefer repository methods that return domain model types (not raw DB payloads). Map DB shape → domain models inside repository layer.
- Error handling: return or throw domain-specific errors defined in `domain/errors` and avoid leaking implementation details to the UI.
- Avoid `any` and implicit `unknown` casts in new code. If necessary, add a short TODO comment explaining why and where to remove it later.

---

## Mobile Rules
- **API Access & HTTP Client**:
  - **Always** use the shared `httpClient` from `mobile/src/infrastructure/http/axios-client.ts` for all API requests.
  - **Never** use `fetch`, direct `axios` imports, or other raw request methods inside the mobile app.
  - **Always** manage API calls, loading states, and response states using TanStack Query queries and mutations. Define them inside `mobile/src/queries/`.
  - Prefer caching and managing state inside queries over using localized React `useState`/`useEffect` hooks to trigger manual requests.
- **Data Persistence**:
  - Use `AsyncStorage` for local storage needs. Avoid referencing it directly in UI components; encapsulate logic within services or state stores.
- **State Management**:
  - Keep state management clean and consistent. Connect backend state via TanStack Query and local UI/discovery state via hooks or dedicated services.

---

## Code Style & Tooling
- Follow the project's existing ESLint/Prettier configuration. Prefer consistent import ordering and named exports for domain logic.
- Write small unit tests for new logic (repositories, commands, and hooks). Integration tests for DB migrations or Tauri interactions are encouraged.

## Examples (prompts to test this instruction)
- "Create a new typed API query inside `mobile/src/queries/` to retrieve some remote resource using the shared `httpClient`."
- "Refactor a mobile component making a direct request to instead consume state and data from a TanStack Query hook."

## Decisions (finalized)
- Scope: apply the rules to both desktop and mobile folders appropriately.
- HTTP client pattern: both platforms use a dedicated `httpClient` (desktop/axios-client vs mobile/axios-client) to encapsulate base URL, headers, timeouts, and auth tokens.
- Query management: both platforms use query layers (CQRS/Dexie in desktop, TanStack Query in mobile) to decouple UI components from raw fetch logic.

## Next Suggested Customizations
- Create templates for new query hooks in the mobile app.
- Add lint checks to forbid imports from `axios` inside non-infrastructure mobile source files.

