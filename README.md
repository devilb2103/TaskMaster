# TaskMaster API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

A RESTful backend API for a task management application built with Node.js, Express, and MongoDB. It handles user authentication (JWT) and provides CRUD operations for managing tasks.

## Features

-   **User Authentication:** Secure user registration and login using JSON Web Tokens (JWT) and bcrypt password hashing.
-   **Protected Routes:** Middleware to protect task-related endpoints, ensuring only authenticated users can access their data.
-   **Task Management (CRUD):** Create, Read (all and by ID), Update, and Delete tasks associated with the logged-in user.
-   **Task Properties:** Tasks include description, status (`pending`, `in-progress`, `completed`), owner reference, and optional due date.
-   **Querying Features:**
    -   **Filtering:** Filter tasks by status (e.g., `?status=completed`).
    -   **Sorting:** Sort tasks by various fields like `createdAt` or `dueDate` (e.g., `?sortBy=dueDate:asc`).
    -   **Pagination:** Limit the number of tasks returned per request and skip pages (e.g., `?limit=5&page=2`).
-   **API Documentation:** Interactive API documentation available via Swagger UI.
-   **Automated Database Backups:** Includes a script for manual or automated (via Cron) MongoDB backups using `mongodump`.
-   **Testing:** Includes unit tests for models and integration tests for API endpoints using Jest, Supertest, and MongoDB Memory Server.
-   **Configuration:** Centralized configuration management using `.env` and `config/config.js`.

## Technology Stack

-   **Backend:** Node.js
-   **Framework:** Express.js
-   **Database:** MongoDB
-   **ODM:** Mongoose
-   **Authentication:** JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
-   **Validation:** `express-validator`
-   **Testing:** Jest, Supertest, MongoDB Memory Server
-   **API Documentation:** Swagger UI (`swagger-ui-express`, `swagger-jsdoc`)
-   **Development:** `nodemon`, `dotenv`, `morgan` (request logging)
-   **Scripting:** Bash (for backup script)

## Prerequisites

Before you begin, ensure you have the following installed:

-   [Node.js](https://nodejs.org/) (v14.x or later recommended)
-   [npm](https://www.npmjs.com/) (usually comes with Node.js) or [Yarn](https://yarnpkg.com/)
-   [Git](https://git-scm.com/)
-   [MongoDB](https://www.mongodb.com/try/download/community) (running locally or accessible via a connection URI like MongoDB Atlas)
-   `mongodump` CLI tool (usually part of MongoDB Database Tools - needed for the backup script)

## Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your_username/taskmaster-api.git # Replace with your repo URL
    cd taskmaster-api
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or: yarn install
    ```

## Environment Configuration

1.  **Create a `.env` file** in the root directory by copying the example file:

    ```bash
    cp .env.example .env
    ```

2.  **Edit the `.env` file** and provide the necessary environment variables:

    ```dotenv
    # Server Configuration
    PORT=3000
    NODE_ENV=development # Use 'production' in production

    # Database Configuration - REQUIRED
    MONGO_URI=mongodb://127.0.0.1:27017/taskmaster-api # Replace with your MongoDB connection string

    # JWT Configuration - REQUIRED
    JWT_SECRET=your_very_strong_and_random_secret_key_at_least_32_characters # IMPORTANT: Use a secure, random key
    JWT_EXPIRES_IN=1h # Examples: 30d, 24h, 60m
    ```

    -   **`MONGO_URI`:** Your connection string for MongoDB.
    -   **`JWT_SECRET`:** A long, random, secret string used to sign JWTs. **Keep this secure and do not commit it directly.**
    -   `PORT`: The port the server will listen on (default: 3000).
    -   `NODE_ENV`: Set to `development` or `production`. Affects logging and error details.
    -   `JWT_EXPIRES_IN`: How long JWT tokens remain valid.

## Running the Application

-   **Development Mode:** (Uses `nodemon` for auto-restarts on file changes)

    ```bash
    npm run dev
    ```

    The server will typically start on `http://localhost:3000`.

-   **Production Mode:**
    ```bash
    npm start
    ```
    This runs the server using `node`. For actual production deployments, consider using a process manager like [PM2](https://pm2.keymetrics.io/).

## Running Tests

Execute the test suite using Jest:

```bash
npm test
```
