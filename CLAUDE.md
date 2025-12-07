# Project general coding guidelines

# About Project

This is an FX Order Entry application. There are two folder in the project: backend and frontend. The backend folder, written in node.js and express.js contains the server side code with websocket and graphql api. The frontend folder, written in typescript and react contains the UI application code. The backend is a mock of my actual order entry system at work, so not much functionality is implemented there. The frontend is a more complete application that connects to the backend and allows users to enter FX orders, which is what I want to focus on.

## Architecture Overview (Frontend)

### Core Principles (Frontend)

This application follows a **Configuration-Driven UI** pattern with **Layered State Management**:

1. **Configuration-Driven UI**: Forms are defined in configuration files, not hardcoded in JSX
2. **Layered State**: Multiple data sources (FDC3 Intent, User Prefs, Manual Input) are merged without conflicts
3. **Zustand Store**: Single source of truth with slice-based architecture
4. **Real-Time Updates**: GraphQL subscriptions for live price and order status updates
5. **No Routing**: Single-view application driven by state machines

### Layering Order (Frontend)

1. **DEFAULTS**: Base form structure, as defined in store
2. **USER PREFERENCES**: User-specific overrides coming from server
3. **FDC3 CONTEXT**: Data from FDC3 Intents
4. **MANUAL INPUT**: User-entered data in the form fields
5. **SUBMISSION STATE**: Temporary state during order submission process

# Bash commands (in frontend folder)

- npm run lint:fix: Run linter and fix linting errors
- npm run build: Build the project

# Code style (Frontend)

- Use ES modules (import/export) syntax, not CommonJS (require)
- Follow TypeScript best practices for typing and interfaces
- Use zustand for state management, organizing state into slices, avoiding large monolithic stores
- Use valibot for input validation schemas and inferred types where possible
- Avoid using any type; prefer precise typings
- Keep components small and focused; prefer composition over large components
- All styles should be in CSS modules, create variables in frontend/src/styles/variables.scss and use them in component specific scss module files
- Review accessibility best practices to ensure the application is usable by all users

# Workflow (Frontend)

- Be sure to run linting and build commands after iteration of code changes
- Always update CODE_CHANGES.md at the root of the project with a summary of changes made
- Follow the code style guidelines above
- When unsure about something, ask for clarification

# Unit Testing (Frontend)

- Use Vitest as the testing framework, test files should be co-located with the files they test and have a .spec.ts or .spec.tsx extension
- Use the wording "expect" for assertions, so tests should read like "expect this to happen when that occurs"
- Mock external dependencies and API calls
- Test both positive and negative scenarios
- Ignore snapshot tests
- Don't test "api", "components", "graphql", "styles" folders.
- Focus on testing "config", "hooks", "store", "utils" folders.
