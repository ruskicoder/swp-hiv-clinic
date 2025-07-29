# HIV Clinic Management System



A comprehensive web-based application for managing HIV clinic operations, patient care, and treatment management. The system provides role-based access control for Guest, Patient, Doctor, and Admin users with a focus on appointment scheduling, ARV treatment tracking, and patient record management.

## 🏥 Project Overview

The HIV Clinic Management System is designed to streamline clinic operations, enhance patient care, and improve treatment management for HIV patients. The system implements modern web technologies with a focus on security, scalability, and user experience.

### Key Features

- **User Management**: Role-based access control with JWT authentication
- **Appointment Management**: Booking, scheduling, and status tracking
- **ARV Treatment Management**: Prescription, monitoring, and treatment history
- **Patient Records**: Comprehensive medical record management
- **Notification System**: Real-time notifications and messaging
- **Privacy Controls**: Patient privacy settings and data protection
- **Admin Dashboard**: System administration and user management
- **Doctor Dashboard**: Patient management and treatment oversight
- **Patient Dashboard**: Personal health information and appointment management

## 🛠️ Technology Stack

### Backend

- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: Microsoft SQL Server
- **Authentication**: JWT (JSON Web Tokens)
- **Build Tool**: Maven 3.9.6
- **ORM**: Spring Data JPA
- **Security**: Spring Security 6.2.1
- **Testing**: JUnit 5, Spring Boot Test

### Frontend

- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.8
- **UI Components**: Custom components with CSS modules
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Testing**: Jest, React Testing Library
- **Linting**: ESLint 8.55.0

### Database

- **Primary Database**: Microsoft SQL Server
- **Schema Management**: SQL scripts with T-SQL syntax
- **Indexing**: Optimized for performance
- **Normalization**: 3rd Normal Form (3NF)

## 📋 Prerequisites

Before running the application, ensure you have the following installed:

- **Java 17** or higher
- **Node.js 18** or higher
- **npm** or **yarn**
- **Microsoft SQL Server** (Local or Remote)
- **Maven 3.9+**
- **Git**

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ruskicoder/swp-hiv-clinic.git
cd swp-hiv-clinic
```

### 2. Database Setup

#### Option A: Using the automated setup script (Windows)

```bash
./setup-database.bat
```

#### Option B: Manual setup

1. Create a new database named `hiv_clinic`
2. Execute the schema creation script:

   ```sql
   -- Run src/main/resources/db/schema.sql
   ```

3. Execute the data population script:

   ```sql
   -- Run src/main/resources/db/data.sql
   ```

### 3. Backend Configuration

Update the database connection settings in `src/main/resources/application.properties`:

```properties
# Database Configuration
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=hiv_clinic;encrypt=true;trustServerCertificate=true
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.datasource.driver-class-name=com.microsoft.sqlserver.jdbc.SQLServerDriver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.SQLServerDialect

# JWT Configuration
jwt.secret=your_jwt_secret_key_here
jwt.expiration=86400000
```

### 4. Frontend Configuration

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=HIV Clinic Management System
```

### 5. Install Dependencies

#### Backend Dependencies

```bash
mvn clean install
```

#### Frontend Dependencies

```bash
npm install
```

### 6. Start the Application

#### Option A: Using the automated start script (Unix/Linux/Mac)

```bash
./start-application.sh
```

#### Option B: Manual startup

**Start Backend (Terminal 1):**

```bash
mvn spring-boot:run
```

**Start Frontend (Terminal 2):**

```bash
npm run dev
```

### 7. Access the Application

- **Frontend**: <http://localhost:3000>
- **Backend API**: <http://localhost:8080/api>
- **Health Check**: <http://localhost:8080/api/health>

## 👥 User Roles & Access

### Guest User

- View public information
- Register for new account
- Access login page

### Patient User

- View personal medical records
- Book and manage appointments
- View ARV treatment history
- Manage privacy settings
- Receive notifications
- Update profile information

### Doctor User

- View assigned patients
- Manage appointments
- Prescribe and monitor ARV treatments
- Update patient medical records
- Send notifications to patients
- Manage availability schedules

### Admin User

- Manage all users (patients, doctors)
- System administration
- View system statistics
- Manage specialties
- User account management
- System health monitoring

## 🔐 Authentication

The system uses JWT (JSON Web Tokens) for authentication:

1. **Registration**: Users can register with email and password
2. **Login**: Authentication returns JWT token
3. **Authorization**: Token-based access control
4. **Role-based Access**: Different permissions for each user role

### Sample API Authentication

```javascript
// Login request
POST /api/auth/login
{
  "username": "user@example.com",
  "password": "password123"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "user@example.com",
    "role": "PATIENT"
  }
}
```

## 📚 API Documentation

### Base URL

``
http://localhost:8080/api
``

### Authentication Endpoints

- `POST /auth/login` - User login (Do Dang Khoa)
- `POST /auth/register` - User registration (Do Dang Khoa)
- `GET /auth/me` - Get current user
- `PUT /auth/profile` - Update user profile
- `GET /auth/check-username` - Check username availability (Nguyen Thanh An)
- `GET /auth/check-email` - Check email availability (Nguyen Thanh An)

### Patient Endpoints

- `GET /patients` - List all patients (Admin only) (Nguyen Thanh Dat)
- `GET /patient-record/my-record` - Get patient's own record (Nguyen Thanh An) 
- `PUT /patient-record/my-record` - Update patient record (Nguyen Thanh An + Tao Minh Tuan) 
- `POST /patient-record/upload-image` - Upload patient image (Nguyen Thanh An)

### Doctor Endpoints

- `GET /doctors` - List all doctors (Do Dang Khoa)
- `GET /doctors/{id}` - Get doctor details (Do Dang Khoa)
- `POST /doctors/availability` - Set doctor availability (Nguyen Thanh Dat)
- `GET /doctors/availability/my-slots` - Get doctor's availability (Nguyen Thanh Dat)
- `PUT /doctors/availability/{slotId}` - Update availability slot (Nguyen Thanh Dat)

### Appointment Endpoints

- `POST /appointments/book` - Book new appointment 
- `GET /appointments/patient/my-appointments` - Get patient appointments
- `GET /appointments/doctor/my-appointments` - Get doctor appointments
- `PUT /appointments/{id}/cancel` - Cancel appointment
- `PUT /appointments/{id}/status` - Update appointment status

### ARV Treatment Endpoints

- `GET /arv-treatments/my-treatments` - Get patient's treatments 
- `POST /arv-treatments/add` - Add new treatment
- `PUT /arv-treatments/{id}` - Update treatment
- `PUT /arv-treatments/{id}/deactivate` - Deactivate treatment

### Notification Endpoints

- `GET /notifications` - Get user notifications (Do Dang Khoa)
- `POST /notifications/{id}/read` - Mark notification as read (Do Dang Khoa)
- `POST /notifications/read-all` - Mark all notifications as read (Do Dang Khoa)
- `POST /notifications/doctor/send` - Send notification to patient (Do Dang Khoa)

### Manager Endpoints

- `GET /api/manager/patients` - Get patient informations (Tao Minh Tuan)
- `GET /api/manager/patients/search?q=abc` - Search patients (Tao Minh Tuan)
- `GET /api/manager/patients/{id}/profile` - View patient profile (Tao Minh Tuan)
- `GET /api/manager/doctors` - Get doctor informations (Tao Minh Tuan)
- `GET /api/manager/doctors/search?q=xyz` - Search doctors (Tao Minh Tuan)
- `GET /api/manager/schedules` - Get schedule informations (Tao Minh Tuan)
- `GET /api/manager/schedules/search?from=yyyy-mm-dd&to=yyyy-mm-dd` - Search schedule by dates (Tao Minh Tuan)

### Admin Endpoints

- `GET /admin/users` - Get all users (Nguyen Thanh Dat)
- `GET /admin/patients` - Get all patients (Nguyen Thanh Dat)
- `GET /admin/doctors` - Get all doctors (Nguyen Thanh Dat)
- `POST /admin/doctors` - Create new doctor (Nguyen Thanh Dat)
- `PUT /admin/users/{id}/toggle-status` - Toggle user status (Nguyen Thanh Dat)

## 🧪 Testing

### Backend Testing

```bash
# Run all tests
mvn test

# Run tests with coverage
mvn test jacoco:report

# Run specific test class
mvn test -Dtest=UserServiceTest
```

### Frontend Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

- **Backend**: 85% coverage
- **Frontend**: 78% coverage
- **Integration Tests**: 92% coverage

## 📁 Project Structure

``
swp-hiv-clinic/
├── src/
│   ├── main/
│   │   ├── java/com/hivclinic/
│   │   │   ├── controller/          # REST Controllers
│   │   │   ├── service/             # Business Logic
│   │   │   ├── repository/          # Data Access Layer
│   │   │   ├── model/               # Entity Models
│   │   │   ├── dto/                 # Data Transfer Objects
│   │   │   ├── config/              # Configuration Classes
│   │   │   └── security/            # Security Configuration
│   │   └── resources/
│   │       ├── db/                  # Database Scripts
│   │       └── application.properties
│   └── test/                        # Test Files
├── src/                             # Frontend Source (React)
│   ├── components/                  # React Components
│   ├── pages/                       # Page Components
│   ├── services/                    # API Services
│   ├── hooks/                       # Custom Hooks
│   ├── utils/                       # Utility Functions
│   └── styles/                      # CSS Styles
├── docs/                            # Documentation
│   ├── RDS_Document_HIV_Clinic_Filled.tex
│   ├── SDS_HIV_Clinic_LaTeX.tex
│   ├── SRS_HIV_Clinic_LaTeX.tex
│   ├── Final_Release_HIV_Clinic_LaTeX.tex
│   ├── Issues_Report_HIV_Clinic_LaTeX.tex
│   └── Project_Tracking_HIV_Clinic_LaTeX.tex
├── pom.xml                          # Maven Configuration
├── package.json                     # Node.js Dependencies
├── vite.config.js                   # Vite Configuration
├── setup-database.bat               # Database Setup Script
└── start-application.sh             # Application Start Script
``

## 🔧 Development

### Code Style

- **Java**: Follow Google Java Style Guide
- **JavaScript/React**: ESLint configuration included
- **SQL**: Use T-SQL syntax for SQL Server compatibility

### Git Workflow

1. Create feature branch from `main`
2. Make changes and commit with descriptive messages
3. Create pull request
4. Code review and merge

### Environment Variables

Create `.env` file for frontend configuration:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=HIV Clinic Management System
VITE_ENABLE_MOCK_DATA=false
```

## 📖 Documentation

Complete documentation is available in the `docs/` directory:

- **[Requirements Document (RDS)](docs/RDS_Document_HIV_Clinic_Filled.tex)** - System requirements and specifications
- **[System Design Document (SDS)](docs/SDS_HIV_Clinic_LaTeX.tex)** - Technical architecture and design
- **[System Requirements Specification (SRS)](docs/SRS_HIV_Clinic_LaTeX.tex)** - Functional and non-functional requirements
- **[Final Release Document](docs/Final_Release_HIV_Clinic_LaTeX.tex)** - Installation guide and user manual
- **[Issues Report](docs/Issues_Report_HIV_Clinic_LaTeX.tex)** - Known issues and resolutions
- **[Project Tracking](docs/Project_Tracking_HIV_Clinic_LaTeX.tex)** - Development progress and metrics

## 🛡️ Security

### Security Features

- JWT-based authentication
- Password hashing with BCrypt
- Role-based access control (RBAC)
- SQL injection prevention
- XSS protection
- CSRF protection
- HTTPS enforcement (production)

### Security Configuration

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    // JWT authentication configuration
    // Role-based authorization
    // CORS configuration
}
```

## 🚀 Deployment

### Production Deployment

1. Update database configuration for production
2. Set production environment variables
3. Build the application:

   ```bash
   mvn clean package
   npm run build
   ```

4. Deploy to your preferred hosting platform

### Docker Support (Optional)

```dockerfile
# Dockerfile for containerized deployment
FROM openjdk:17-jdk-slim
COPY target/hiv-clinic-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app.jar"]
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify SQL Server is running
   - Check connection string in application.properties
   - Ensure database exists and user has permissions

2. **Port Conflicts**
   - Backend default port: 8080
   - Frontend default port: 3000
   - Change ports in configuration if needed

3. **Authentication Issues**
   - Check JWT secret configuration
   - Verify token expiration settings
   - Clear browser cache and cookies

4. **Build Errors**
   - Run `mvn clean install` to refresh dependencies
   - Check Java version compatibility
   - Verify Node.js version

## 📊 Performance

### Database Performance

- Optimized queries with proper indexing
- Connection pooling configured
- Query performance monitoring

### Frontend Performance

- Code splitting with React.lazy
- Optimized bundle size
- Caching strategies implemented

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow existing code style
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📞 Support

For support and questions:

- Create an issue on GitHub
- Contact the development team
- Check the documentation in `/docs` folder

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Spring Boot community for the excellent framework
- React community for the powerful frontend library
- Contributors and testers who helped improve the system
- Healthcare professionals who provided domain expertise

---
