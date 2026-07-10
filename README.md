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
Start the development server using nodemon (which will automatically restart on file changes):
```bash
npm run dev
```
The server will start on `http://localhost:3000` (or the `PORT` you specified in your `.env`).

## Available Scripts

Here are the core npm scripts used in this project:

| Script | Description |
|---|---|
| `npm run dev` | Starts the application in development mode using `nodemon`. Automatically reloads on file changes. |
| `npm run start` | Runs the compiled application (standard execution). |
| `npm run migration:generate -- src/migrations/Name` | Analyzes your TypeORM entities and generates a new migration file with the provided name based on any changes. |
| `npm run migration:run` | Applies all pending migrations to the database. |
| `npm run migration:revert` | Reverts the most recently applied database migration. |

## Project Structure

The annotated folder tree:

```text
src/
├── controllers/    ← HTTP layer
├── services/       ← Business logic & transactions
├── entities/       ← TypeORM entities (DB source of truth)
├── routes/         ← Express routers + Zod schemas
├── middleware/     ← Auth, validation, error handling
├── migrations/     ← Auto-generated migrations
├── utils/          ← AppError, shared helpers
└── config/         ← App configuration
```

## API Overview

*Not full API docs, but a grouped summary of every route — method, path, auth requirement, and a brief description. Organized by module.*

### Auth (`/api/auth`)
- `POST /signup` (Public) - Register a new user and business.
- `POST /verify-otp` (Public) - Verify email/phone using a 6-digit code.
- `POST /resend-otp` (Public) - Request a new verification code.
- `POST /login` (Public) - Authenticate and receive JWT tokens.
- `POST /refresh` (Public) - Generate a new access token using a refresh token.
- `POST /forgot-password` (Public) - Request a password reset code.
- `POST /reset-password` (Public) - Reset password using the code.

### Users (`/api/users`)
- `POST /accept-invite` (Public) - Accept a team invite.
- `GET /me` (Auth) - Retrieve current user profile.
- `PATCH /me` (Auth) - Update current user profile.
- `PATCH /me/password` (Auth) - Change password.
- `POST /invite` (Auth + OWNER/ADMIN) - Invite a new user to the business.
- `GET /` (Auth + OWNER/ADMIN) - List all users in the business.
- `GET /:id` (Auth + OWNER/ADMIN) - Get details for a specific user.
- `PATCH /:id` (Auth + OWNER/ADMIN) - Update user roles.
- `DELETE /:id` (Auth + OWNER) - Remove a user from the business.

### Roles (`/api/roles`)
- `GET /` (Auth + OWNER/ADMIN) - List all roles in the business.
- `POST /` (Auth + OWNER) - Create a custom role.
- `GET /:id` (Auth + OWNER/ADMIN) - Get role details and permissions.
- `PATCH /:id` (Auth + OWNER) - Update a role's metadata.
- `PUT /:id/permissions` (Auth + OWNER) - Update a role's granular permissions.
- `DELETE /:id` (Auth + OWNER) - Delete a custom role.

### Business (`/api/business`)
- `GET /` (Auth) - Get current business details.
- `PATCH /` (Auth + OWNER) - Update business profile.

### Invitations (`/api/invitations`)
- `GET /` (Auth + OWNER/ADMIN) - List all pending invitations.
- `DELETE /:id` (Auth + OWNER/ADMIN) - Revoke a pending invitation.