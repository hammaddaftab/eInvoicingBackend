# eInvoice Backend

RESTful API for UAE e-invoicing: business registration, user management, role-based access control, and OTP verification.

## Getting Started (Local Development)

Follow these steps to set up and run the project locally.

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **PostgreSQL** (v14 or higher)
- **npm** (comes with Node.js)

### 2. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 3. Environment Configuration
The application relies on environment variables for database connections and security.
Copy the provided example file to create your local `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your local PostgreSQL credentials (`PGUSER`, `PGPASSWORD`, `PGDATABASE`) and generate a secure `JWT_SECRET`.

### 4. Database Setup
TypeORM will manage your tables, but the database itself must exist first. Create the database in PostgreSQL (e.g., using `psql` or a tool like pgAdmin):
```bash
createdb uae_einvoice_db
```
*(Make sure the database name matches what you set for `PGDATABASE` in your `.env` file).*

### 5. Run Migrations
With the database created and credentials configured, apply the TypeORM migrations to build the tables:
```bash
npm run migration:run
```

### 6. Start the Server
Start the development server using nodemon (which will automatically restart on file changes and regenerate routes):
```bash
npm run dev
```
The server will start on `http://localhost:3000` (or the `PORT` you specified in your `.env`).

## Available Scripts

Here are the core npm scripts used in this project:

| Script | Description |
|---|---|
| `npm run dev` | Starts the app in dev mode using `nodemon`. Automatically regenerates TSOA routes and reloads on file changes. |
| `npm run start` | Runs the compiled application (standard execution). |
| `npm run tsoa:gen` | Manually generates the TSOA routes and OpenAPI (Swagger) specifications based on the controllers. |
| `npm run migration:generate -- src/migrations/Name` | Analyzes your TypeORM entities and generates a new migration file with the provided name based on any changes. |
| `npm run migration:run` | Applies all pending migrations to the database. |
| `npm run migration:revert` | Reverts the most recently applied database migration. |

## Project Structure

The annotated folder tree:

```text
src/
├── controllers/    ← TSOA HTTP Controllers (API endpoints)
├── dtos/           ← TypeScript interfaces (API payloads & validation rules)
├── services/       ← Business logic & transactions
├── entities/       ← TypeORM entities (DB source of truth)
├── generated/      ← Auto-generated TSOA routes and Swagger definitions
├── middleware/     ← Error handling
├── migrations/     ← Auto-generated database migrations
├── utils/          ← AppError, shared helpers
└── authentication.ts ← TSOA authentication configuration
```

## API Documentation

This project uses **TSOA** to automatically generate OpenAPI (Swagger) documentation directly from our TypeScript controllers and DTOs. 

Once the server is running, you can view the fully interactive API documentation, complete with payload schemas and authentication requirements, by navigating to:
**[http://localhost:3000/docs](http://localhost:3000/docs)**