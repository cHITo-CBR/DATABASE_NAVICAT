---
name: Backend Architecture
description: Robust and secure backend development using Node.js and API best practices.
---

# Backend Architecture Skill

This skill focuses on building scalable, maintainable, and secure backend services.

## Core Principles
1. **API First**: Design clear and consistent API contracts (REST or GraphQL).
2. **Separation of Concerns**: Keep business logic, data access, and entry points (controllers) distinct.
3. **Security by Default**: Implement authentication, authorization, and input validation early.
4. **Error Handling**: Use structured error responses and comprehensive logging.

## Implementation Guidelines
- Use environment variables for secrets and configuration.
- Implement structured logging (e.g., winston or pino).
- Ensure all database interactions are parameterized to prevent SQL injection.

## Project Structure
- `api/` or `server/`: Backend entry points.
- `lib/`: Shared utilities and services.
- `middleware/`: Common request handlers (auth, logging).
