# HIV Medical Treatment System

A comprehensive web application for managing HIV medical treatment with appointment booking functionality.

## Features

- User authentication and role-based access control
- Appointment booking and management
- Doctor availability management
- Patient and doctor profiles
- Admin dashboard for system oversight

## Technology Stack

### Backend

- Spring Boot 3.2.0
- Spring Security with JWT authentication
- Spring Data JPA
- Microsoft SQL Server
- Maven

### Frontend

- React 18
- Vite
- Axios for API communication
- React Router for navigation

---

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm (v8+ recommended)
- Java 17+
- Maven
- Microsoft SQL Server (local or remote)

### 1. Database Setup

#### Windows
- Run `setup-database.bat` and follow the prompts.
- Or manually:
  1. Start SQL Server.
  2. Open SQL Server Management Studio.
  3. Run `src/main/resources/db/schema.sql` and then `src/main/resources/db/data.sql`.

#### Linux/Mac
- Run `./setup-database.sh` in the project root.
- This will create the database, tables, and insert initial data.

#### Test Database
- Run `./test-database.sh` to verify database connectivity and data.

#### Default Accounts
- **Admin:** username: `admin`, password: `admin123`
- **Doctor:** username: `doctor1`, password: `doctor123`
- **Patient:** username: `patient1`, password: `patient123`

### 2. Backend Setup

```bash
cd d:/DATA/Github/swp-hiv-clinic
mvn spring-boot:run
```
- The backend will start at `http://localhost:8080/api`
- Health check: [http://localhost:8080/api/health](http://localhost:8080/api/health)

### 3. Frontend Setup

```bash
cd d:/DATA/Github/swp-hiv-clinic
npm install
npm run dev
```
- The frontend will start at [http://localhost:3000](http://localhost:3000)

---

## API Documentation for Frontend Developers

All endpoints are prefixed with `/api`.

### Authentication
| Method | Endpoint                | Description                  |
|--------|------------------------|------------------------------|
| POST   | `/auth/login`          | User login                   |
| POST   | `/auth/register`       | User registration            |
| GET    | `/auth/check-username` | Check username availability  |
| GET    | `/auth/check-email`    | Check email availability     |
| GET    | `/auth/me`             | Get current user profile     |
| PUT    | `/auth/profile`        | Update user profile          |
| POST   | `/auth/profile-image`  | Update profile image         |

### Patient Endpoints
| Method | Endpoint                                      | Description                                 |
|--------|-----------------------------------------------|---------------------------------------------|
| GET    | `/appointments/patient/my-appointments`       | Get all patient appointments                |
| GET    | `/appointments/patient/upcoming`              | Get upcoming appointments                   |
| POST   | `/appointments/book`                          | Book an appointment                         |
| PUT    | `/appointments/{appointmentId}/cancel`        | Cancel an appointment                       |
| GET    | `/patient-records/my-record`                  | Get own medical record                      |
| PUT    | `/patient-records/my-record`                  | Update own medical record                   |
| POST   | `/patient-records/upload-image`               | Upload image to medical record              |
| GET    | `/arv-treatments/my-treatments`               | Get own ARV treatment history               |
| GET    | `/patients/privacy-settings`                  | Get privacy mode                            |
| POST   | `/patients/privacy-settings`                  | Set privacy mode                            |

### Doctor Endpoints
| Method | Endpoint                                         | Description                                 |
|--------|--------------------------------------------------|---------------------------------------------|
| GET    | `/appointments/doctor/my-appointments`           | Get all doctor appointments                 |
| GET    | `/doctors/availability/my-slots`                 | Get doctor's availability slots             |
| POST   | `/doctors/availability`                          | Add availability slot                       |
| DELETE | `/doctors/availability/{slotId}`                 | Delete availability slot                    |
| GET    | `/appointments/{appointmentId}/patient-record`   | Get patient record for appointment          |
| PUT    | `/appointments/{appointmentId}/status`           | Update appointment status/details           |
| PUT    | `/patient-records/patient/{patientId}`           | Update patient record                       |
| POST   | `/arv-treatments/add`                            | Add ARV treatment for patient               |
| GET    | `/arv-treatments/patient/{patientId}`            | Get ARV treatments for patient              |
| PUT    | `/arv-treatments/{treatmentId}/edit`             | Edit ARV treatment                          |
| PUT    | `/arv-treatments/{treatmentId}/deactivate`       | Deactivate ARV treatment                    |
| DELETE | `/arv-treatments/{treatmentId}`                  | Delete ARV treatment                        |

### Admin Endpoints
| Method | Endpoint                              | Description                                 |
|--------|---------------------------------------|---------------------------------------------|
| GET    | `/admin/health`                       | Health check                                |
| GET    | `/admin/users`                        | List all users                              |
| GET    | `/admin/patients`                     | List all patients                           |
| GET    | `/admin/doctors`                      | List all doctors                            |
| GET    | `/admin/appointments`                 | List all appointments                       |
| GET    | `/admin/specialties`                  | List all specialties                        |
| POST   | `/admin/doctors`                      | Create doctor account                       |
| PUT    | `/admin/users/{userId}/toggle-status` | Activate/deactivate user                    |
| PUT    | `/admin/users/{userId}/reset-password`| Reset user password                         |
| POST   | `/admin/specialties`                  | Create new specialty                        |

### Health Endpoints
| Method | Endpoint           | Description                |
|--------|--------------------|----------------------------|
| GET    | `/health`          | Basic health check         |
| GET    | `/health/db`       | Database connectivity      |
| GET    | `/health/status`   | System status              |

---

## How to Use and Test API Endpoints

1. **Get a JWT Token:**
   - Use `/auth/login` to authenticate and receive a token.
   - Example:
     ```bash
     curl -X POST http://localhost:8080/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"username":"patient1","password":"patient123"}'
     ```
   - The response will include a `token` field.

2. **Include the Token:**
   - For protected endpoints, add `Authorization: Bearer <token>` to your request headers.

3. **Test with Postman or curl:**
   - Set method, URL, headers, and body as needed.
   - For file uploads, use `multipart/form-data` if required.
   - Example (get appointments):
     ```bash
     curl -H "Authorization: Bearer <token>" \
       http://localhost:8080/api/appointments/patient/my-appointments
     ```

4. **Check Responses:**
   - Success: HTTP 200/201 with JSON data.
   - Error: HTTP 400/401/403/500 with error message.

5. **Refer to Frontend Service Files:**
   - See `src/services/apiClient.js` and `src/services/authService.js` for example usage.

6. **For endpoints with `{id}` in the path:**
   - Replace with the actual resource ID.

7. **For more details on request/response payloads:**
   - See backend controller JavaDocs or inspect API responses in your browser's network tab.

---

## Troubleshooting

- **Connection refused:** Check if SQL Server and backend are running.
- **Login failed:** Verify username/password and database setup.
- **Port conflicts:** Ensure ports 8080 (backend) and 3000 (frontend) are available.
- **CORS issues:** The backend is configured to allow all origins for development.

---

## Useful Scripts

- `setup-database.bat` / `setup-database.sh`: Setup database and initial data.
- `test-database.sh`: Test database connectivity and data.
- `start-application.sh`: Start both backend and frontend together (Linux/Mac).

---

## Support

- For issues, check the application logs or open an issue on GitHub.
- For more details, see the code comments and service/controller files.