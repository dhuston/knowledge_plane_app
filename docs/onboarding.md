# KnowledgePlane AI - Onboarding

Welcome to the KnowledgePlane AI project!

## 1. Vision & Goal

Our mission is to "Get your organization on the same page, enabling seamless collaboration, alignment, and adaptation." **The core user experience centers around an interactive, AI-powered "Living Map" of your organization's work.**

Read the full details in [VISION_STRATEGY.md](./VISION_STRATEGY.md).

## 2. Architecture Overview

We are building a multi-tenant SaaS platform using a microservices architecture hosted on AWS.

Key technical choices and decisions are documented in:

* [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)
* Architecture Decision Records (ADRs) in [/docs/adr/](./adr/)

## 3. Getting Started (Frontend)

1. **Prerequisites:** Ensure you have Node.js (v18+) and npm installed.
2. **Clone:** Clone the repository.
3. **Navigate:** `cd frontend`
4. **Install Dependencies:** `npm install`
5. **Run Dev Server:** `npm run dev` (App will be available at <http://localhost:5173>)
6. **Run Tests:** `npm test`

## 4. Codebase Structure

* `frontend/`: Contains the React frontend code.
  * `src/`: Main source code.
    * `main.tsx`: Application entry point, theme setup.
    * `App.tsx`: Root component, routing setup.
    * `index.css`: Base CSS (minimal).
    * `components/`: Reusable UI components (e.g., layout).
    * `pages/`: Top-level page components for routes.
    * `mockData.ts`: Static mock data for demo purposes.
  * `public/`: Static assets.
* `docs/`: Project-level documentation (Vision, Architecture, ADRs, etc.)
* *(Backend directories will be added later)*

## 5. Key Documents

* [VISION_STRATEGY.md](./VISION_STRATEGY.md)
* [PRODUCT_BACKLOG.md](./PRODUCT_BACKLOG.md)
* [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)
* [/docs/adr/](./adr/) - Architecture Decision Records
* [/docs/data-model.md](./data-model.md) (WIP)

## 6. Development Practices

* **Workflow:** Kanban (see `KANBAN_*.md` files - manual for now).
* **Branching:** (TBD - e.g., Gitflow, GitHub Flow)
* **Code Style:** TypeScript, Prettier, ESLint (config files in frontend root).
* **Testing:** Vitest + React Testing Library (run with `npm test`). Basic component rendering tests initially, expanding as logic is added.
* **Reviews:** Pull Request reviews encouraged for all non-trivial changes.
