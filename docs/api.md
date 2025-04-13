
Requests to protected endpoints without a valid token will result in a `401 Unauthorized` error.

## User Endpoints (`/api/users`)

Endpoints related to user accounts and authentication.

### 1. Register User

*   **URL:** `/register`
*   **Method:** `POST`
*   **Access:** Public
*   **Description:** Creates a new user account.
*   **Request Body:**
    ```json
    {
        "name": "Your Name",
        "email": "user@example.com",
        "password": "yourpassword"
    }
    ```
    *   `name`: String, required.
    *   `email`: String (valid email format), required, unique.
    *   `password`: String, required, minimum 6 characters.
*   **Response:**
    *   `201 Created`: User registered successfully. (Response body might be a confirmation message or potentially the user object without password. The login endpoint provides the token).
    *   `400 Bad Request`: If validation fails (e.g., missing fields, invalid email, password too short) or if the email already exists. Response body contains an `errors` array.

### 2. Login User

*   **URL:** `/login`
*   **Method:** `POST`
*   **Access:** Public
*   **Description:** Authenticates an existing user and returns a JWT.
*   **Request Body:**
    ```json
    {
        "email": "user@example.com",
        "password": "yourpassword"
    }
    ```
    *   `email`: String (valid email format), required.
    *   `password`: String, required.
*   **Response:**
    *   `200 OK`: Login successful.
        ```json
        {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNj..."
        }
        ```
    *   `400 Bad Request`: If validation fails.
    *   `401 Unauthorized`: If credentials (email or password) are incorrect.

### 3. Get Current User Profile

*   **URL:** `/me`
*   **Method:** `GET`
*   **Access:** Private (Requires Authentication)
*   **Description:** Retrieves the profile information of the currently authenticated user.
*   **Response:**
    *   `200 OK`: Returns the user object (excluding the password field).
        ```json
        {
            "_id": "60d0fe4f5311236168a109ca",
            "name": "Your Name",
            "email": "user@example.com",
            "createdAt": "2024-07-20T14:30:00.000Z"
        }
        ```
    *   `401 Unauthorized`: If the token is missing, invalid, or expired.

### 4. Logout User (Conceptual)

*   **URL:** `/logout`
*   **Method:** `POST`
*   **Access:** Private (Requires Authentication)
*   **Description:** Endpoint to signal logout. As JWT is stateless, the primary action is for the client to discard the token.
*   **Response:**
    *   `200 OK`: Returns a success message.
        ```json
        {
            "message": "Logout successful (client should clear token)"
        }
        ```
    *   `401 Unauthorized`: If the token is missing or invalid.


## Task Endpoints (`/api/tasks`)

Endpoints for managing tasks associated with the authenticated user. All task endpoints require authentication.

### 1. Create Task

*   **URL:** `/` (relative to `/api/tasks`)
*   **Method:** `POST`
*   **Access:** Private (Requires Authentication)
*   **Description:** Creates a new task for the authenticated user.
*   **Request Body:**
    ```json
    {
        "description": "My new task description",
        "status": "pending", // Optional, defaults to 'pending'. Enum: 'pending', 'in-progress', 'completed'
        "dueDate": "2024-12-31T18:30:00.000Z" // Optional, ISO 8601 date format
    }
    ```
    *   `description`: String, required.
    *   `status`: String, optional.
    *   `dueDate`: String (ISO Date), optional.
*   **Response:**
    *   `201 Created`: Returns the newly created task object.
    *   `400 Bad Request`: If validation fails (e.g., missing description, invalid status/date).
    *   `401 Unauthorized`: If authentication fails.

### 2. Get User's Tasks

*   **URL:** `/` (relative to `/api/tasks`)
*   **Method:** `GET`
*   **Access:** Private (Requires Authentication)
*   **Description:** Retrieves a list of tasks belonging to the authenticated user. Supports filtering and sorting.
*   **Query Parameters:**
    *   `status` (String, optional): Filter tasks by their status (e.g., `?status=pending`). Allowed values: `pending`, `in-progress`, `completed`.
    *   `sortBy` (String, optional): Sort tasks. Format `field:order`. Examples: `?sortBy=createdAt:desc` (default), `?sortBy=dueDate:asc`, `?sortBy=status:asc`. Allowed fields: `createdAt`, `status`, `description`, `dueDate`. Order: `asc` or `desc`.
    *   *(Pagination parameters `limit` and `page` will be added later)*
*   **Response:**
    *   `200 OK`: Returns an array of task objects matching the criteria.
        ```json
        [
            {
                "_id": "task_id_1",
                "description": "Task 1",
                "status": "pending",
                "dueDate": null,
                "owner": "user_id",
                "createdAt": "..."
            },
            {
                "_id": "task_id_2",
                "description": "Task 2",
                "status": "in-progress",
                "dueDate": "2024-09-01T00:00:00.000Z",
                "owner": "user_id",
                "createdAt": "..."
            }
            // ...
        ]
        ```
    *   `401 Unauthorized`: If authentication fails.

### 3. Get Single Task

*   **URL:** `/:id` (relative to `/api/tasks`)
*   **Method:** `GET`
*   **Access:** Private (Requires Authentication)
*   **Description:** Retrieves a specific task by its ID, if it belongs to the authenticated user.
*   **URL Parameters:**
    *   `id`: String (MongoDB ObjectId), required. The ID of the task.
*   **Response:**
    *   `200 OK`: Returns the task object.
    *   `401 Unauthorized`: If the user does not own the task or authentication fails.
    *   `404 Not Found`: If no task exists with the provided ID.

### 4. Update Task

*   **URL:** `/:id` (relative to `/api/tasks`)
*   **Method:** `PUT`
*   **Access:** Private (Requires Authentication)
*   **Description:** Updates an existing task belonging to the authenticated user.
*   **URL Parameters:**
    *   `id`: String (MongoDB ObjectId), required. The ID of the task to update.
*   **Request Body:** (Include only the fields you want to update)
    ```json
    {
        "description": "Updated task description",
        "status": "completed",
        "dueDate": "2024-11-30T10:00:00.000Z"
    }
    ```
*   **Response:**
    *   `200 OK`: Returns the updated task object.
    *   `400 Bad Request`: If validation fails.
    *   `401 Unauthorized`: If the user does not own the task or authentication fails.
    *   `404 Not Found`: If no task exists with the provided ID.

### 5. Delete Task

*   **URL:** `/:id` (relative to `/api/tasks`)
*   **Method:** `DELETE`
*   **Access:** Private (Requires Authentication)
*   **Description:** Deletes a specific task by its ID, if it belongs to the authenticated user.
*   **URL Parameters:**
    *   `id`: String (MongoDB ObjectId), required. The ID of the task to delete.
*   **Response:**
    *   `200 OK`: Returns a success message.
        ```json
        {
            "msg": "Task removed successfully"
        }
        ```
    *   `401 Unauthorized`: If the user does not own the task or authentication fails.
    *   `404 Not Found`: If no task exists with the provided ID.