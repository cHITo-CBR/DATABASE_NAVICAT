---
name: Database Architecture
description: Expert relational database design, optimization, and security.
---

# Database Architecture Skill

This skill ensures that the data layer is performant, scalable, and secure.

## Core Principles
1. **Normalization vs. Performance**: Aim for 3rd Normal Form for integrity, but denormalize judiciously for performance.
2. **Indexing Strategy**: Use indexes to speed up common queries while being mindful of their impact on write performance.
3. **Data Integrity**: Use foreign keys, check constraints, and transactions to maintain consistent data.
4. **Security (RLS)**: Implement Row-Level Security where appropriate to protect data at the database level.

## Guidelines
- Use migrations for all schema changes—never modify the database manually.
- Monitor query performance and use `EXPLAIN ANALYZE` for slow queries.
- Ensure backups and recovery plans are in place.

## Supabase/Postgres Specifics
- Use schemas to organize tables logically.
- Leverage Postgres functions and triggers for complex business logic if needed.
