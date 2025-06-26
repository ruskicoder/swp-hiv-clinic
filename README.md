# SWP HIV Clinic

A web application for managing HIV clinic operations.

## Project Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/ruskicoder/swp-hiv-clinic.git
   cd swp-hiv-clinic
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

   or

   ```bash
   yarn install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and update the values as needed.

4. **Run database migrations (if applicable):**

   ```bash
   npm run migrate
   ```

5. **Start the development server:**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:4000` (or as configured).

## API Documentation

### Base URL

```text
http://localhost:4000/api
```

### Example Endpoints

#### `GET /api/patients`

- **Description:** Retrieve a list of all patients.
- **Response:**

  ```json
  [
    {
      "id": 1,
      "name": "John Doe",
      "dob": "1990-01-01",
      "status": "active"
    }
    // ...
  ]
  ```

#### `POST /api/patients`

- **Description:** Create a new patient record.
- **Request Body:**

  ```json
  {
    "name": "Jane Smith",
    "dob": "1985-05-12",
    "status": "active"
  }
  ```

- **Response:** Returns the created patient object.

#### `GET /api/appointments`

- **Description:** List all appointments.

#### `POST /api/appointments`

- **Description:** Create a new appointment.

> For detailed API documentation, see the [API docs](docs/api.md) or use the OpenAPI/Swagger UI if available at `/api-docs`.

## Testing

1. **Run all tests:**

   ```bash
   npm test
   ```

   or

   ```bash
   yarn test
   ```

2. **Run tests with coverage:**

   ```bash
   npm run test:coverage
   ```

3. **Testing tools:**  
   - Unit tests: [Jest](https://jestjs.io/) or [Mocha](https://mochajs.org/)
   - API tests: [Supertest](https://github.com/visionmedia/supertest)

4. **Add new tests:**  
   Place test files in the `tests/` directory, following the naming convention `*.test.js`.

## Contributing

- Fork the repository and create your branch.
- Submit a pull request with a clear description of your changes.

## License

This project is licensed under the MIT License.
