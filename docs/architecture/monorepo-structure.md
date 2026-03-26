# Monorepo Structure

## Apps

- `apps/web`: Vite + React frontend
- `apps/api`: HTTP API for uploads, application state, reports, and job orchestration
- `apps/agent-runner`: background workflows, agent graphs, queues, and prompt/tool execution

## Packages

- `packages/shared-types`: shared TypeScript contracts between web, API, and agents
- `packages/domain`: pure business logic such as scoring thresholds and credit policy helpers
- `packages/data-access`: database and storage adapters
- `packages/config`: reusable workspace-level constants and config helpers

## Docs

- `docs/api`: backend integration notes and API-facing specs
- `docs/architecture`: repository and system design notes
- `docs/assets`: demo media and documentation assets
