# Backend Architecture

The BuildForge API strictly follows a layered architecture to ensure separation of concerns, testability, and maintainability.

## 1. Routes (`/routes`)
- Define HTTP methods and URL paths.
- Attach route-level middlewares (e.g., authentication, validation).
- Map requests to the appropriate Controller method.
- **Rule**: NO business logic here.

## 2. Controllers (`/controllers`)
- Handle the HTTP Request and Response objects.
- Extract data from `req.body`, `req.params`, `req.query`, etc.
- Call the appropriate Service methods.
- Format the response using the `sendSuccess` helper.
- **Rule**: Must remain thin. NO database access or complex business logic.

## 3. Services (`/services`)
- Contain the core business logic of the application.
- Orchestrate operations, calculations, and external API calls.
- Throw `AppError` subclasses if business rules are violated.
- Independent of the HTTP transport layer (they don't know about `req` or `res`).
- **Rule**: NO direct database queries using Prisma. Must call Repositories.

## 4. Repositories (`/repositories` or direct Prisma calls inside specific files)
- Handle all data access and persistence.
- Encapsulate Prisma queries.
- **Rule**: Services should be the only layer accessing Repositories or the Prisma client directly.
