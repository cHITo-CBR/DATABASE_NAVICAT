# Project Migration: Next.js to Laravel 12

I have an existing project built with Next.js using a MySQL database.

I want to fully migrate this system into a Laravel 12 application while preserving:
- All database tables, relationships, and constraints
- Business logic and workflows
- System architecture and modular structure

## Requirements

### 1. DATABASE
- Analyze and extract the full MySQL schema (tables, columns, types, indexes, foreign keys)
- Convert it into Laravel migrations
- Ensure compatibility with Navicat for live querying and management
- Use best practices (UUIDs if applicable, proper indexing, normalization)

### 2. BACKEND (Laravel 12)
- Convert all API routes into Laravel controllers
- Implement Models with Eloquent relationships
- Do NOT use Laravel REST API resources unless necessary
- Follow a modular structure (e.g., separate files for models, controllers, services)

### 3. ARCHITECTURE
- Recreate the system architecture in Laravel:
  - **Controllers**: Handling requests
  - **Services**: Business logic
  - **Models**: Database layer
- Maintain clean code principles (DRY, separation of concerns)

### 4. FEATURES MIGRATION
- Map each feature from Next.js to Laravel equivalent
- **Example**:
  - API routes → Laravel `routes/web.php` or `api.php`
  - Fetch/axios calls → Controller methods
  - Server-side logic → Services or Controllers

### 5. DATABASE CONNECTION
- Configure Laravel to connect to MySQL (XAMPP or local server)
- Ensure Navicat can view and modify data in real-time

### 6. OUTPUT FORMAT
Provide:
- Laravel folder structure
- Migration files
- Model relationships
- Controller examples
- Step-by-step migration plan

## Optional
- Suggest improvements to optimize performance and scalability.

---

**Role**: Act as a senior Laravel architect. Ensure the system is scalable, production-ready, and follows Laravel 12 best practices.
