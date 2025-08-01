# HIV Clinic Management System - Comprehensive Documentation

## Table of Contents
1. [The Big Picture - System Overview](#1-the-big-picture---system-overview)
2. [The Backend Deep Dive (Spring Boot)](#2-the-backend-deep-dive-spring-boot)
3. [The Frontend Deep Dive (React)](#3-the-frontend-deep-dive-react)
4. [Data Flow Walkthroughs](#4-data-flow-walkthroughs)
5. [Getting Started Guide](#5-getting-started-guide)

---

## 1. The Big Picture - System Overview

### 1.1. Introduction to the Project

**What This Application Does:**
The HIV Clinic Management System is a comprehensive web application designed to help healthcare providers manage HIV patients, appointments, treatments, and medical records. From a user's perspective, this is a complete digital solution that allows:

- **Patients** to book appointments, view their treatment schedules, and access their medical records
- **Doctors** to manage their schedules, review patient records, and track treatments
- **Managers** to oversee clinic operations, generate reports, and manage staff
- **Administrators** to manage system users, settings, and overall system health

**Core Technologies Explained:**

**Spring Boot (The Backend Engine):**
Think of Spring Boot as the engine and brain of our application. Just like a car's engine runs behind the scenes to make the car move, Spring Boot runs on a server computer and handles all the heavy lifting:
- Stores and retrieves data from the database
- Processes business logic (like calculating appointment schedules)
- Handles security (making sure only authorized users can access certain features)
- Provides data to the frontend through a special communication protocol called REST APIs

**React (The User Interface):**
React is the beautiful face of our application—everything you see and interact with in your web browser. It's like the dashboard and controls in a car that let you interact with the engine:
- Creates interactive forms, buttons, and displays
- Shows real-time updates without refreshing the page
- Manages what users see based on their role (patient, doctor, etc.)
- Communicates with the backend to get and send data

**How They Work Together:**
They talk to each other over the internet using a special language called an API (Application Programming Interface). When you click "Book Appointment" in React, it sends a message to Spring Boot saying "Please create an appointment," and Spring Boot responds with "Appointment created successfully" or "Error: Time slot not available."

### 1.2. System Architecture

Think of our system like a restaurant with clear roles and responsibilities:

#### **React Frontend (The Dining Room)**
This is where customers (users) sit and interact with the menu (the user interface). Customers can:
- Browse the menu (view available appointments)
- Place orders (book appointments, update profiles)
- Receive their food (get appointment confirmations, medical records)

The dining room has different sections for different types of customers:
- **Patient Section**: Where patients manage their health records and appointments
- **Doctor Section**: Where doctors review patient cases and manage schedules
- **Manager Section**: Where clinic managers oversee operations
- **Admin Section**: Where system administrators manage users and settings

#### **REST API (The Waitstaff)**
The waitstaff takes orders from customers and brings them to the kitchen. They also bring the prepared food back to customers. In our system:
- **HTTP Requests**: When a user clicks a button, it's like placing an order
- **HTTP Responses**: When the system sends back data, it's like delivering the food
- **Endpoints**: These are like different order windows (e.g., `/api/appointments` for appointment-related requests)

#### **Spring Boot Backend (The Kitchen)**
The kitchen is divided into different stations, each with specific responsibilities:

**Controller Layer (The Head Chef):**
- Receives orders from the waitstaff (HTTP requests)
- Doesn't do the actual cooking but directs the flow
- Decides which sous chef (service) should handle each order
- Ensures orders are properly formatted and valid

**Service Layer (The Sous Chefs):**
- Contains the actual business logic—the "cooking" of our application
- Examples of "cooking":
  - Checking if a doctor is available before booking an appointment
  - Calculating medication schedules
  - Validating that a patient has permission to access certain records
  - Sending notifications for upcoming appointments

**Repository Layer (The Pantry/Storage):**
- This is where ingredients (data) are stored and retrieved
- Handles all database operations
- Knows how to find, save, update, and delete information
- Translates business requests into database queries

**Database (The Main Storage):**
- Microsoft SQL Server stores all our data
- Contains tables for users, appointments, medical records, etc.
- Ensures data integrity and security

### 1.3. How to Run the Project

**Prerequisites (What You Need Installed):**

1. **Java JDK 17**: The runtime environment for our Spring Boot backend
   ```bash
   # Check if you have Java 17
   java -version
   ```

2. **Node.js v18 or higher**: The runtime for our React frontend
   ```bash
   # Check if you have Node.js
   node --version
   npm --version
   ```

3. **Microsoft SQL Server**: Our database system
   - You can use SQL Server Express (free) or Docker container
   - Default connection: `localhost:1433`
   - Database name: `hiv_clinic`
   - Username: `sa`, Password: `12345`

**Step-by-Step Startup Guide:**

1. **Clone and Navigate to Project:**
   ```bash
   git clone [repository-url]
   cd hiv-clinic-management
   ```

2. **Start the Database:**
   Make sure SQL Server is running and the `hiv_clinic` database exists.

3. **Start the Backend (Spring Boot):**
   ```bash
   # Install dependencies and start the backend server
   mvn clean install
   mvn spring-boot:run
   ```
   The backend will start on `http://localhost:8080`

4. **Start the Frontend (React):**
   ```bash
   # In a new terminal window
   npm install
   npm run dev
   ```
   The frontend will start on `http://localhost:5173`

5. **Access the Application:**
   Open your web browser and go to `http://localhost:5173`

---

## 2. The Backend Deep Dive (Spring Boot)

### 2.1. Core Concepts Explained

Before diving into the code, let's understand the fundamental Spring Boot concepts:

#### **Bean**
**In a Nutshell:** An object that Spring manages for you.

**Detailed Explanation:** In regular Java, when you need an object, you create it using `new ClassName()`. In Spring, you tell Spring "I need this type of object," and Spring creates it, configures it, and gives it to you when needed. Spring also handles the object's lifecycle (creation, initialization, destruction).

Example: Instead of writing `UserService userService = new UserService()`, you write `@Autowired UserService userService` and Spring provides it.

#### **Dependency Injection**
**In a Nutshell:** Spring automatically provides objects with the other objects they need to work.

**Detailed Explanation:** Imagine you're building a car. The engine needs fuel injection, the fuel injection needs a fuel pump, and the fuel pump needs a power source. Instead of the engine having to find and create its own fuel injection system, Spring acts like an assembly line that provides each component with exactly what it needs. This makes code more modular and testable.

#### **Annotation (@)**
**In a Nutshell:** A special label you put on your code to tell Spring what to do with it.

**Detailed Explanation:** Annotations are like sticky notes with instructions. When Spring sees `@RestController` on a class, it knows "This class should handle web requests." When it sees `@Service`, it knows "This class contains business logic." Annotations are Spring's way of understanding your intentions without you having to write configuration files.

#### **REST Controller (@RestController)**
**In a Nutshell:** Marks a class as a handler for web requests.

**Detailed Explanation:** When someone types a URL in their browser or when the React frontend makes an API call, Spring needs to know which piece of code should handle that request. Classes marked with `@RestController` are like customer service representatives—they're the front desk that receives requests and provides responses.

#### **JPA (Java Persistence API)**
**In a Nutshell:** A standard way to talk to databases in Java.

**Detailed Explanation:** JPA is like a translator between Java objects and database tables. Instead of writing SQL queries like `SELECT * FROM Users WHERE id = 1`, you can write Java code like `userRepository.findById(1)`. JPA automatically converts your Java method calls into the appropriate SQL statements.

### 2.2. Folder and File Structure

Let's explore the backend structure package by package:

#### **com.hivclinic (Root Package)**
This is the main package that contains our entire application.

**HivClinicBackendApplication.java** - The Entry Point:
```java
@SpringBootApplication  // Tells Spring this is the main application class
@EnableScheduling      // Enables automatic task scheduling (like appointment reminders)
public class HivClinicBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(HivClinicBackendApplication.class, args);
    }
}
```

#### **com.hivclinic.model (Entity Package)**
Contains the data models that represent database tables.

**Key Purpose:** These classes define the structure of our data and how it's stored in the database. Each class represents a database table, and each field represents a column.

#### **com.hivclinic.controller (Presentation Layer)**
Contains REST controllers that handle HTTP requests.

**Key Purpose:** These are the "front desk" classes that receive requests from the React frontend and coordinate responses.

#### **com.hivclinic.service (Business Logic Layer)**
Contains service classes that implement business rules and logic.

**Key Purpose:** This is where the actual "work" of the application happens—appointment scheduling logic, user validation, medical record processing, etc.

#### **com.hivclinic.repository (Data Access Layer)**
Contains repository interfaces that handle database operations.

**Key Purpose:** These interfaces define how to store, retrieve, update, and delete data from the database.

#### **com.hivclinic.dto (Data Transfer Objects)**
Contains request and response classes for API communication.

**Key Purpose:** These classes define the structure of data sent between the frontend and backend, ensuring type safety and validation.

### 2.3. Layer-by-Layer Code Explanation

#### **Controller Layer Deep Dive**

Let's examine the `AuthController` - the authentication front desk:

```java
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {
```

**What each annotation means:**
- `@RestController`: "This class handles web requests and returns JSON responses"
- `@RequestMapping("/api/auth")`: "All methods in this class handle URLs starting with /api/auth"
- `@CrossOrigin`: "Allow requests from other domains (like our React app on port 5173)"

**Registration Endpoint:**
```java
@PostMapping("/register")
public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
```

**Step-by-step breakdown:**
1. `@PostMapping("/register")`: "Handle POST requests to /api/auth/register"
2. `@Valid`: "Check that the incoming data meets our validation rules"
3. `@RequestBody`: "Take the JSON from the request body and convert it to a RegisterRequest object"
4. The method validates password confirmation, calls the AuthService to do the actual registration work, and returns an appropriate response

**Login Endpoint Analysis:**
```java
@PostMapping("/login")
public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
    try {
        logger.info("Login attempt for username: {}", loginRequest.getUsername());
        
        // Extract IP address and user agent for security tracking
        String ipAddress = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        
        // Call the service to do the actual authentication
        AuthResponse response = authService.authenticateUser(loginRequest, ipAddress, userAgent);
        
        logger.info("User logged in successfully: {}", loginRequest.getUsername());
        return ResponseEntity.ok(response);
    } catch (Exception e) {
        logger.warn("Login failed for username {}: {}", loginRequest.getUsername(), e.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(MessageResponse.error("Invalid credentials: " + e.getMessage()));
    }
}
```

**What this does line by line:**
1. Log that someone is trying to log in (for security monitoring)
2. Get the user's IP address and browser information (for security tracking)
3. Ask the AuthService to verify the username and password
4. If successful, log the success and return user information
5. If failed, log the failure and return an error message

#### **Service Layer Deep Dive**

The service layer is where our business logic lives. Let's examine key services:

**AuthService - User Authentication Logic:**

The AuthService handles the complex logic of user authentication:

```java
@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtTokenProvider tokenProvider;
```

**Key responsibilities:**
1. **Password Security**: Uses bcrypt encryption to hash passwords before storing them
2. **JWT Token Generation**: Creates secure tokens that prove a user is logged in
3. **User Validation**: Checks if usernames and emails are already taken
4. **Profile Management**: Handles user profile updates and image uploads

**Password Encryption Example:**
```java
// Instead of storing "mypassword123", we store something like:
// "$2a$10$N9qo8uLOickgx2ZMRZoMye3p0y4pkmjqz6YdH8/+UvrcIz6Bt.ld2"
String hashedPassword = passwordEncoder.encode(plainPassword);
```

This ensures that even if someone gains access to our database, they can't see actual passwords.

**AppointmentService - Complex Business Logic:**

The AppointmentService demonstrates sophisticated business logic:

```java
@Service
public class AppointmentService {
    
    public AppointmentDTO bookAppointment(BookAppointmentRequest request) {
        // 1. Validate that the time slot is available
        // 2. Check that the doctor is working at that time
        // 3. Ensure the patient doesn't have a conflicting appointment
        // 4. Create the appointment
        // 5. Send notifications to both patient and doctor
        // 6. Update the doctor's availability
    }
}
```

**Step-by-step appointment booking logic:**
1. **Time Validation**: Ensure the requested time is in the future and during business hours
2. **Doctor Availability**: Check if the doctor has an available slot at that time
3. **Patient Conflicts**: Verify the patient doesn't already have an appointment at that time
4. **Business Rules**: Apply clinic-specific rules (like minimum time between appointments)
5. **Database Transaction**: Save all changes atomically (all succeed or all fail)
6. **Notifications**: Send confirmation emails/SMS to both parties

#### **Repository Layer Deep Dive**

Repositories are our connection to the database. They're interfaces that Spring implements automatically:

```java
@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    
    // Spring automatically implements these methods based on the method names:
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    List<User> findByRoleRoleName(String roleName);
    
    // Custom query for complex searches:
    @Query("SELECT u FROM User u WHERE u.isActive = true AND u.role.roleName = :roleName")
    List<User> findActiveUsersByRole(@Param("roleName") String roleName);
}
```

**How Spring Magic Works:**
- `findByUsername(String username)` automatically becomes `SELECT * FROM Users WHERE Username = ?`
- `findByEmail(String email)` becomes `SELECT * FROM Users WHERE Email = ?`
- Spring reads the method name and creates the SQL query for you!

#### **Model/Entity Layer Deep Dive**

Entities are Java classes that represent database tables:

**User Entity - The Core User Model:**

```java
@Entity
@Table(name = "Users")
public class User implements UserDetails {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "UserID")
    private Integer userId;
```

**What each annotation means:**
- `@Entity`: "This class represents a database table"
- `@Table(name = "Users")`: "Map to the 'Users' table in the database"
- `@Id`: "This field is the primary key"
- `@GeneratedValue`: "Let the database automatically assign values (auto-increment)"
- `@Column(name = "UserID")`: "Map to the 'UserID' column"

**Relationships Between Entities:**

```java
@ManyToOne(fetch = FetchType.EAGER)
@JoinColumn(name = "RoleID", nullable = false)
private Role role;
```

This means "Each user has one role, but each role can be assigned to many users." It's like saying "Each employee works for one department, but each department has many employees."

**PatientProfile Entity - Extended Patient Information:**

```java
@Entity
@Table(name = "PatientProfiles")
public class PatientProfile {
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID", nullable = false, unique = true)
    private User user;
```

This creates a one-to-one relationship: "Each patient profile belongs to exactly one user, and each user can have at most one patient profile."

### 2.4. Data Flow Walkthrough

Let's trace what happens when a patient books an appointment:

**Step 1: User Action (React Frontend)**
```javascript
// User clicks "Book Appointment" button
const handleBookAppointment = async () => {
    const appointmentData = {
        doctorId: selectedDoctor.id,
        appointmentDateTime: selectedDateTime,
        appointmentNotes: notes
    };
    
    // Send request to backend
    const response = await apiClient.post('/api/appointments/book', appointmentData);
};
```

**Step 2: Request Arrives at Controller**
```java
@PostMapping("/book")
public ResponseEntity<?> bookAppointment(@RequestBody BookAppointmentRequest request) {
    // Controller receives the JSON data and converts it to a Java object
    logger.info("Booking appointment for patient {} with doctor {}", 
                request.getPatientId(), request.getDoctorId());
    
    // Pass the request to the service layer
    AppointmentDTO result = appointmentService.bookAppointment(request);
    
    return ResponseEntity.ok(result);
}
```

**Step 3: Service Layer Processing**
```java
@Transactional
public AppointmentDTO bookAppointment(BookAppointmentRequest request) {
    // 1. Validate the doctor exists and is active
    User doctor = userRepository.findById(request.getDoctorId())
        .orElseThrow(() -> new RuntimeException("Doctor not found"));
    
    // 2. Check if the time slot is available
    boolean isAvailable = isTimeSlotAvailable(doctor.getId(), request.getDateTime());
    if (!isAvailable) {
        throw new RuntimeException("Time slot not available");
    }
    
    // 3. Create the appointment
    Appointment appointment = new Appointment();
    appointment.setDoctorUser(doctor);
    appointment.setPatientUser(currentUser);
    appointment.setAppointmentDateTime(request.getDateTime());
    appointment.setStatus("Scheduled");
    
    // 4. Save to database
    appointment = appointmentRepository.save(appointment);
    
    // 5. Send notifications
    notificationService.sendAppointmentConfirmation(appointment);
    
    // 6. Return the result
    return appointmentMapper.toDTO(appointment);
}
```

**Step 4: Database Operations**
```sql
-- Spring automatically generates these SQL statements:

-- Check doctor exists:
SELECT * FROM Users WHERE UserID = ? AND IsActive = 1

-- Check availability:
SELECT COUNT(*) FROM Appointments 
WHERE DoctorUserID = ? 
AND AppointmentDateTime BETWEEN ? AND ?
AND Status != 'Cancelled'

-- Create appointment:
INSERT INTO Appointments (PatientUserID, DoctorUserID, AppointmentDateTime, Status, CreatedAt, UpdatedAt)
VALUES (?, ?, ?, 'Scheduled', GETDATE(), GETDATE())
```

**Step 5: Response Back to Frontend**
```java
// The appointment is converted to a DTO and sent back as JSON:
{
    "appointmentId": 123,
    "doctorName": "Dr. Smith",
    "appointmentDateTime": "2024-01-15T14:30:00",
    "status": "Scheduled",
    "message": "Appointment booked successfully"
}
```

**Step 6: Frontend Updates UI**
```javascript
// React receives the response and updates the user interface
if (response.success) {
    setAppointments([...appointments, response.data]);
    showNotification("Appointment booked successfully!");
    setShowBookingModal(false);
} else {
    showError(response.message);
}
```

---

## 3. The Frontend Deep Dive (React)

### 3.1. Core Concepts Explained

#### **Component**
**In a Nutshell:** A reusable piece of the UI, like a button or a navigation bar.

**Detailed Explanation:** Think of components like LEGO blocks. Each block has a specific shape and function, and you can combine them to build complex structures. A React component encapsulates both the visual appearance (what it looks like) and behavior (what it does when clicked) into a single, reusable unit.

Example: A `LoginForm` component contains the username field, password field, submit button, and the logic to handle form submission. You can use this same component on both the main login page and a modal popup.

#### **Props**
**In a Nutshell:** How a parent component sends data down to a child component.

**Detailed Explanation:** Props (short for properties) are like parameters you pass to a function. When you want a component to display different content or behave differently, you pass props to customize it.

Example:
```jsx
// Parent component passes data to child
<UserCard 
    name="John Doe" 
    role="Doctor" 
    email="john@clinic.com" 
/>

// UserCard component receives and uses the props
function UserCard({ name, role, email }) {
    return (
        <div>
            <h3>{name}</h3>
            <p>Role: {role}</p>
            <p>Email: {email}</p>
        </div>
    );
}
```

#### **State (useState)**
**In a Nutshell:** A component's internal memory. When it changes, the component re-renders.

**Detailed Explanation:** State is like a component's brain—it remembers things and can change over time. When state changes, React automatically updates the visual display to reflect the new state.

Example:
```jsx
function AppointmentForm() {
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [appointmentDate, setAppointmentDate] = useState('');
    
    // When user selects a doctor, the component "remembers" this choice
    const handleDoctorChange = (doctor) => {
        setSelectedDoctor(doctor); // This triggers a re-render
    };
}
```

#### **Effect (useEffect)**
**In a Nutshell:** A way to run code after the component has rendered, often used for fetching data.

**Detailed Explanation:** Effects let you perform "side effects" like calling APIs, setting up timers, or subscribing to events. They run after the component appears on screen and can run again when certain values change.

Example:
```jsx
function PatientDashboard() {
    const [appointments, setAppointments] = useState([]);
    
    // Load appointments when component first appears
    useEffect(() => {
        fetchAppointments();
    }, []); // Empty array means "run once when component mounts"
    
    // Reload when user changes
    useEffect(() => {
        if (user) {
            fetchAppointments();
        }
    }, [user]); // Run when 'user' changes
}
```

#### **JSX**
**In a Nutshell:** A syntax that lets you write HTML-like code inside your JavaScript.

**Detailed Explanation:** JSX looks like HTML but it's actually JavaScript. It lets you describe what the UI should look like in a way that's easy to read and understand. React converts JSX into regular JavaScript function calls.

Example:
```jsx
// This JSX:
const loginButton = <button onClick={handleLogin}>Login</button>;

// Gets converted to this JavaScript:
const loginButton = React.createElement('button', { onClick: handleLogin }, 'Login');
```

### 3.2. Folder and File Structure

Let's explore the React frontend structure:

#### **src/ (Main Source Directory)**

**main.jsx - Application Entry Point:**
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**What this does:**
1. Finds the HTML element with id="root" in public/index.html
2. Creates a React "root" that will control that element
3. Renders the `App` component inside it
4. `React.StrictMode` helps catch bugs during development

**App.jsx - Main Application Component:**
```jsx
function App() {
  return (
    <ErrorBoundary>           {/* Catches and handles React errors */}
      <BrowserRouter>         {/* Enables navigation between pages */}
        <AuthProvider>        {/* Provides user authentication state */}
          <div className="App">
            <AppRouter />     {/* Handles routing to different pages */}
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
```

#### **src/routes/ - Navigation and Routing**

**AppRouter.jsx - The Navigation System:**

This component decides which page to show based on the URL:

```jsx
const AppRouter = () => {
  return (
    <Routes>
      {/* Public routes - anyone can access */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      
      {/* Protected routes - only logged-in users */}
      <Route path="/customer" element={
        <ProtectedRoute allowedRoles={['Patient']}>
          <CustomerDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/doctor" element={
        <ProtectedRoute allowedRoles={['Doctor']}>
          <DoctorDashboard />
        </ProtectedRoute>
      } />
    </Routes>
  );
};
```

**ProtectedRoute Component - Security Guard:**
```jsx
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  // Still checking authentication status
  if (loading) {
    return <LoadingSpinner />;
  }

  // User not logged in - redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User doesn't have permission - redirect to home
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // User is authorized - show the content
  return children;
};
```

#### **src/contexts/ - Global State Management**

**AuthContext.jsx - User Authentication State:**

This context provides user authentication information to the entire application:

```jsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Check if user is already logged in when app starts
  useEffect(() => {
    const initializeAuth = async () => {
      const token = sessionStorage.getItem('token');
      if (token) {
        try {
          const userProfile = await authService.getUserProfile();
          setUser(userProfile);
        } catch (error) {
          // Token is invalid, remove it
          sessionStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    
    initializeAuth();
  }, []);
  
  const login = async (credentials) => {
    // Handle login logic
    const response = await authService.login(credentials);
    if (response.success) {
      sessionStorage.setItem('token', response.token);
      setUser(response.user);
    }
    return response;
  };
  
  const logout = () => {
    sessionStorage.removeItem('token');
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### **src/services/ - API Communication**

**apiClient.js - HTTP Request Configuration:**
```jsx
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',  // Backend server URL
  timeout: 10000,                       // 10 second timeout
});

// Automatically add authentication token to requests
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle authentication errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 3.3. Component-by-Component Explanation

#### **Authentication Components**

**Login Component:**
```jsx
function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await login(formData);
      if (result.success) {
        // Redirect based on user role
        switch (result.user.role) {
          case 'Patient':
            navigate('/customer');
            break;
          case 'Doctor':
            navigate('/doctor');
            break;
          case 'Manager':
            navigate('/manager');
            break;
          default:
            navigate('/');
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Username"
        value={formData.username}
        onChange={(e) => setFormData({
          ...formData,
          username: e.target.value
        })}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({
          ...formData,
          password: e.target.value
        })}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

**What this component does:**
1. **State Management**: Manages form data, error messages, and loading state
2. **Form Handling**: Captures user input and validates it
3. **Authentication**: Calls the login service when form is submitted
4. **Navigation**: Redirects users to appropriate dashboard based on their role
5. **Error Handling**: Shows error messages if login fails
6. **UX**: Disables the button and shows loading text during login process

#### **Dashboard Components**

**PatientDashboard Component:**
```jsx
function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load patient data when component mounts
  useEffect(() => {
    const loadPatientData = async () => {
      try {
        setLoading(true);
        
        // Load appointments
        const appointmentsResponse = await apiClient.get('/appointments/patient');
        setAppointments(appointmentsResponse.data);
        
        // Filter upcoming appointments
        const now = new Date();
        const upcoming = appointmentsResponse.data.filter(
          apt => new Date(apt.appointmentDateTime) > now
        );
        setUpcomingAppointments(upcoming);
        
        // Load notifications
        const notificationsResponse = await apiClient.get('/notifications');
        setNotifications(notificationsResponse.data);
        
      } catch (error) {
        console.error('Failed to load patient data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadPatientData();
    }
  }, [user]);

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await apiClient.put(`/appointments/${appointmentId}/cancel`, {
        reason: 'Patient cancellation'
      });
      
      // Update local state to reflect the cancellation
      setAppointments(prev => prev.map(apt => 
        apt.appointmentId === appointmentId 
          ? { ...apt, status: 'Cancelled' }
          : apt
      ));
      
      // Remove from upcoming appointments
      setUpcomingAppointments(prev => 
        prev.filter(apt => apt.appointmentId !== appointmentId)
      );
      
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="patient-dashboard">
      <header>
        <h1>Welcome, {user.firstName} {user.lastName}</h1>
      </header>
      
      <section className="upcoming-appointments">
        <h2>Upcoming Appointments</h2>
        {upcomingAppointments.length === 0 ? (
          <p>No upcoming appointments</p>
        ) : (
          upcomingAppointments.map(appointment => (
            <AppointmentCard 
              key={appointment.appointmentId}
              appointment={appointment}
              onCancel={() => handleCancelAppointment(appointment.appointmentId)}
            />
          ))
        )}
      </section>
      
      <section className="recent-notifications">
        <h2>Recent Notifications</h2>
        <NotificationList notifications={notifications} />
      </section>
    </div>
  );
}
```

**What this component does:**
1. **Data Loading**: Fetches appointments and notifications when component loads
2. **State Management**: Manages multiple pieces of state (appointments, notifications, loading)
3. **Data Processing**: Filters appointments to show only upcoming ones
4. **User Actions**: Handles appointment cancellation
5. **Conditional Rendering**: Shows loading spinner while data loads, shows "no appointments" message when empty
6. **Component Composition**: Uses smaller components like `AppointmentCard` and `NotificationList`

### 3.4. API Communication Layer

**authService.js - Authentication API Calls:**
```jsx
const authService = {
  async login(credentials) {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      if (response.data) {
        return {
          success: true,
          token: response.data.token,
          user: {
            id: response.data.id,
            username: response.data.username,
            role: response.data.role,
            email: response.data.email
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  },

  async getUserProfile() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async updateProfile(profileData) {
    try {
      const response = await apiClient.put('/auth/profile', profileData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed'
      };
    }
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Server logout error:', error);
    } finally {
      sessionStorage.removeItem('token');
    }
  }
};
```

**How API Communication Works:**

1. **Request Preparation**: The service function prepares the data and determines the HTTP method (GET, POST, PUT, DELETE)

2. **HTTP Request**: `apiClient` (axios) sends the request to the Spring Boot backend

3. **Request Interceptor**: Automatically adds the authentication token to the request headers

4. **Backend Processing**: Spring Boot receives the request, processes it, and sends back a response

5. **Response Interceptor**: Checks for authentication errors and handles them globally

6. **Response Processing**: The service function processes the response and returns a standardized format to the component

7. **Component Update**: The component receives the response and updates its state, which triggers a re-render

**Error Handling Strategy:**
- **Network Errors**: Handle connection failures gracefully
- **Authentication Errors**: Automatically redirect to login when token expires
- **Validation Errors**: Display specific field errors to users
- **Server Errors**: Show user-friendly error messages

---

## 4. Data Flow Walkthroughs

### Complete User Registration Flow

Let's trace what happens when a new user registers:

**Step 1: User Fills Registration Form (Frontend)**
```jsx
// In Register.jsx component
const [formData, setFormData] = useState({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  role: 'Patient'
});

const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Frontend validation
  if (formData.password !== formData.confirmPassword) {
    setError('Passwords do not match');
    return;
  }
  
  // Call authentication service
  const result = await authService.register(formData);
  
  if (result.success) {
    navigate('/login', { 
      state: { message: 'Registration successful! Please log in.' }
    });
  } else {
    setError(result.message);
  }
};
```

**Step 2: API Call to Backend**
```javascript
// In authService.js
async register(userData) {
  try {
    const response = await apiClient.post('/auth/register', userData);
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Registration failed'
    };
  }
}
```

**Step 3: Backend Controller Receives Request**
```java
// In AuthController.java
@PostMapping("/register")
public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
    try {
        // Log the registration attempt
        logger.info("Registration attempt for username: {}", registerRequest.getUsername());
        
        // Validate password confirmation
        if (!registerRequest.getPassword().equals(registerRequest.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(
                MessageResponse.builder()
                    .success(false)
                    .message("Password and confirmation password do not match")
                    .build()
            );
        }
        
        // Delegate to service layer
        MessageResponse response = authService.registerUser(registerRequest);
        
        if (response.isSuccess()) {
            logger.info("User registered successfully: {}", registerRequest.getUsername());
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    } catch (Exception e) {
        logger.error("Error during registration: {}", e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(MessageResponse.error("Registration failed: " + e.getMessage()));
    }
}
```

**Step 4: Service Layer Processing**
```java
// In AuthService.java
@Transactional
public MessageResponse registerUser(RegisterRequest registerRequest) {
    try {
        // Check if username already exists
        if (userRepository.findByUsername(registerRequest.getUsername()).isPresent()) {
            return MessageResponse.builder()
                .success(false)
                .message("Username is already taken!")
                .build();
        }

        // Check if email already exists
        if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            return MessageResponse.builder()
                .success(false)
                .message("Email is already in use!")
                .build();
        }

        // Get the default role (Patient)
        Role userRole = roleRepository.findByRoleName("Patient")
            .orElseThrow(() -> new RuntimeException("Default role not found"));

        // Create new user entity
        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPasswordHash(passwordEncoder.encode(registerRequest.getPassword()));
        user.setFirstName(registerRequest.getFirstName());
        user.setLastName(registerRequest.getLastName());
        user.setRole(userRole);
        user.setIsActive(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        // Save user to database
        user = userRepository.save(user);

        // Create patient profile if role is Patient
        if ("Patient".equals(registerRequest.getRole())) {
            createPatientProfile(user, registerRequest);
        }

        logger.info("User registered successfully with ID: {}", user.getUserId());
        
        return MessageResponse.builder()
            .success(true)
            .message("User registered successfully!")
            .build();

    } catch (Exception e) {
        logger.error("Registration error: {}", e.getMessage(), e);
        return MessageResponse.builder()
            .success(false)
            .message("Registration failed: " + e.getMessage())
            .build();
    }
}

private void createPatientProfile(User user, RegisterRequest request) {
    PatientProfile profile = new PatientProfile();
    profile.setUser(user);
    profile.setFirstName(request.getFirstName());
    profile.setLastName(request.getLastName());
    profile.setIsPrivate(false); // Default to public profile
    
    patientProfileRepository.save(profile);
}
```

**Step 5: Database Operations**
```sql
-- Spring JPA automatically generates these SQL statements:

-- Check username availability:
SELECT COUNT(*) FROM Users WHERE Username = 'john_doe';

-- Check email availability:
SELECT COUNT(*) FROM Users WHERE Email = 'john@example.com';

-- Get role ID:
SELECT RoleID FROM Roles WHERE RoleName = 'Patient';

-- Insert new user:
INSERT INTO Users (Username, Email, PasswordHash, FirstName, LastName, RoleID, IsActive, CreatedAt, UpdatedAt)
VALUES ('john_doe', 'john@example.com', '$2a$10$...', 'John', 'Doe', 1, 1, GETDATE(), GETDATE());

-- Insert patient profile:
INSERT INTO PatientProfiles (UserID, FirstName, LastName, IsPrivate)
VALUES (123, 'John', 'Doe', 0);
```

**Step 6: Response Back Through Layers**
The success response travels back:
- **Service** returns `MessageResponse` with success=true
- **Controller** wraps it in `ResponseEntity.ok()`
- **HTTP Response** sent as JSON to frontend
- **Frontend** receives response and navigates to login page
- **User** sees success message and can now log in

---

## 5. Getting Started Guide

### Prerequisites Installation

**1. Install Java JDK 17:**

**Windows:**
```bash
# Download from Oracle or use package manager
winget install Oracle.JDK.17
```

**macOS:**
```bash
# Using Homebrew
brew install openjdk@17
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install openjdk-17-jdk
```

**Verify Installation:**
```bash
java -version
# Should show: openjdk version "17.x.x"
```

**2. Install Node.js (v18 or higher):**

**Windows/macOS:**
- Download from [nodejs.org](https://nodejs.org/)
- Run the installer

**Linux:**
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verify Installation:**
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 8.x.x or higher
```

**3. Install Microsoft SQL Server:**

**Option A: SQL Server Express (Recommended for development)**
- Download SQL Server Express from Microsoft
- Install with default settings
- Enable SQL Server Authentication
- Set SA password to `12345` (or update application.properties)

**Option B: Docker Container**
```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=12345" -p 1433:1433 --name sqlserver -d mcr.microsoft.com/mssql/server:2019-latest
```

**4. Create Database:**
```sql
-- Connect to SQL Server and run:
CREATE DATABASE hiv_clinic;
```

### Project Setup and Execution

**1. Clone the Repository:**
```bash
git clone [your-repository-url]
cd hiv-clinic-management-system
```

**2. Backend Setup:**
```bash
# Navigate to project root (where pom.xml is located)
cd hiv-clinic-management-system

# Install Maven dependencies
mvn clean install

# Update database configuration if needed
# Edit src/main/resources/application.properties:
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=hiv_clinic;encrypt=true;trustServerCertificate=true
spring.datasource.username=sa
spring.datasource.password=12345

# Start the backend server
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

**3. Frontend Setup:**
```bash
# Open a new terminal window
# Navigate to the project root
cd hiv-clinic-management-system

# Install NPM dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:5173`

**4. Verify Everything is Working:**

**Backend Health Check:**
```bash
# Test backend is running
curl http://localhost:8080/api/health
# Should return: {"status":"UP"}
```

**Frontend Access:**
- Open browser to `http://localhost:5173`
- You should see the HIV Clinic Management System homepage

**Database Connection:**
- Check the backend console logs
- Should see: "Connected to database successfully" (or similar)
- Should see Hibernate SQL logging if enabled

### Initial System Setup

**1. Create Admin User:**
The system should automatically create default roles and an admin user on first startup. If not, you can create one manually:

```sql
-- Insert roles
INSERT INTO Roles (RoleName) VALUES ('Admin'), ('Manager'), ('Doctor'), ('Patient');

-- Insert admin user (password is 'admin123' hashed)
INSERT INTO Users (Username, Email, PasswordHash, FirstName, LastName, RoleID, IsActive, CreatedAt, UpdatedAt)
VALUES ('admin', 'admin@clinic.com', '$2a$10$...', 'System', 'Admin', 1, 1, GETDATE(), GETDATE());
```

**2. First Login:**
- Navigate to `http://localhost:5173/login`
- Use credentials: `admin` / `admin123`
- You should be redirected to the admin dashboard

**3. Create Additional Users:**
Through the admin interface, you can create:
- Managers to oversee clinic operations
- Doctors to manage patient appointments
- Patients to book appointments and view records

### Development Workflow

**1. Making Backend Changes:**
- Edit Java files in `src/main/java/`
- The application will automatically restart (Spring Boot DevTools)
- Check console for errors
- Test API endpoints using Postman or curl

**2. Making Frontend Changes:**
- Edit React files in `src/`
- Vite will automatically reload the browser
- Check browser console for errors
- Use React DevTools browser extension for debugging

**3. Database Schema Changes:**
- Update entity classes in `src/main/java/com/hivclinic/model/`
- Spring Boot will automatically update the database schema (ddl-auto=update)
- For production, use proper database migrations

**4. Testing Your Changes:**
```bash
# Run backend tests
mvn test

# Run frontend tests
npm test

# Run with coverage
npm run test:coverage
```

### Troubleshooting Common Issues

**1. Backend Won't Start:**
- Check Java version: `java -version`
- Verify database is running and accessible
- Check port 8080 isn't already in use: `netstat -an | grep 8080`
- Review application.properties for correct database settings

**2. Frontend Won't Start:**
- Check Node.js version: `node --version`
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check port 5173 isn't in use

**3. Database Connection Issues:**
- Verify SQL Server is running
- Test connection with SQL Server Management Studio
- Check firewall settings
- Verify connection string in application.properties

**4. CORS Issues:**
- Check that frontend URL is listed in application.properties:
  ```properties
  app.cors.allowed-origins=http://localhost:3000,http://localhost:5173
  ```

**5. Authentication Problems:**
- Clear browser storage: localStorage and sessionStorage
- Check JWT secret key in application.properties
- Verify token expiration settings

### Next Steps

Once you have the system running:

1. **Explore the Codebase**: Use this documentation to understand how different parts work together

2. **Create Test Data**: Add some sample patients, doctors, and appointments to see the system in action

3. **Customize Features**: Modify existing features or add new ones based on your clinic's needs

4. **Deploy to Production**: Set up proper database, configure security settings, and deploy to a cloud provider

5. **Monitor and Maintain**: Set up logging, monitoring, and backup procedures

---

## 6. Detailed Entity Relationships and Database Schema

### 6.1. Core Entity Analysis

#### **User Entity - The Foundation**
```java
@Entity
@Table(name = "Users")
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "UserID")
    private Integer userId;
    
    @Column(name = "Username", nullable = false, unique = true)
    private String username;
    
    @JsonIgnore
    @Column(name = "PasswordHash", nullable = false)
    private String passwordHash;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "RoleID", nullable = false)
    private Role role;
}
```

**What This Means:**
- **Primary Key**: `userId` is auto-generated, starting from 1
- **Username Uniqueness**: No two users can have the same username
- **Security**: Password is never sent to frontend (marked with `@JsonIgnore`)
- **Role Relationship**: Each user has exactly one role (Patient, Doctor, Manager, Admin)
- **Spring Security Integration**: Implements `UserDetails` for authentication

#### **Role Entity - User Permissions**
```java
@Entity
@Table(name = "Roles")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RoleID")
    private Integer roleId;
    
    @Column(name = "RoleName", nullable = false, unique = true, length = 50)
    private String roleName;
}
```

**System Roles Explained:**
1. **Patient**: Can book appointments, view their records, manage their profile
2. **Doctor**: Can manage their schedule, view patient records, update treatment plans
3. **Manager**: Can oversee clinic operations, view reports, manage staff scheduling
4. **Admin**: Has full system access, can manage users, system settings, and configurations

#### **PatientProfile Entity - Extended Patient Information**
```java
@Entity
@Table(name = "PatientProfiles")
public class PatientProfile {
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID", nullable = false, unique = true)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "Gender", length = 20)
    private Gender gender;
    
    @Column(name = "IsPrivate", nullable = false)
    private Boolean isPrivate = false;
    
    @Column(name = "BloodType", length = 10)
    private String bloodType;
}
```

**Key Features:**
- **One-to-One Relationship**: Each patient profile belongs to exactly one user
- **Privacy Controls**: `isPrivate` flag controls data visibility to other users
- **Medical Information**: Stores health-specific data like blood type and emergency contacts
- **Gender Enum**: Uses predefined gender values for consistency

#### **Appointment Entity - Scheduling System**
```java
@Entity
@Table(name = "Appointments")
public class Appointment {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PatientUserID", nullable = false)
    private User patientUser;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DoctorUserID", nullable = false)
    private User doctorUser;
    
    @Column(name = "AppointmentDateTime", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime appointmentDateTime;
    
    @Column(name = "Status", nullable = false, length = 50)
    private String status = "Scheduled";
}
```

**Appointment Lifecycle:**
1. **Scheduled**: Initial state when appointment is booked
2. **Confirmed**: Doctor or clinic confirms the appointment
3. **In Progress**: Appointment is currently happening
4. **Completed**: Appointment finished successfully
5. **Cancelled**: Appointment was cancelled by patient or doctor
6. **No Show**: Patient didn't attend the appointment

#### **Notification System**
```java
@Entity
@Table(name = "Notifications")
public class Notification {
    @Enumerated(EnumType.STRING)
    @Column(name = "Type", nullable = false, length = 50)
    private NotificationType type;
    
    public enum NotificationType {
        APPOINTMENT_REMINDER("APPOINTMENT_REMINDER"),
        MEDICATION_REMINDER("MEDICATION_REMINDER"),
        GENERAL("GENERAL"),
        SYSTEM_NOTIFICATION("SYSTEM_NOTIFICATION");
    }
    
    public enum Priority {
        LOW("LOW"),
        MEDIUM("MEDIUM"),
        HIGH("HIGH"),
        URGENT("URGENT");
    }
}
```

**Notification Features:**
- **Type-Based**: Different notification types for different purposes
- **Priority Levels**: Ensures important notifications get proper attention
- **Scheduling**: Can be scheduled for future delivery
- **Status Tracking**: Tracks whether notifications were sent and read

### 6.2. Data Relationships Visualization

```
Users (1) ←→ (1) PatientProfiles
  ↓
  (1) Role
  
Users (Patient) (1) ←→ (∞) Appointments
Users (Doctor) (1) ←→ (∞) Appointments

Users (1) ←→ (∞) Notifications

Appointments (∞) ←→ (1) DoctorAvailabilitySlot

Users (Patient) (1) ←→ (1) PatientRecord
PatientRecord (1) ←→ (∞) ARVTreatments
```

---

## 7. Advanced Frontend Component Analysis

### 7.1. CustomerDashboard - Complete Patient Interface

The `CustomerDashboard` is the main interface for patients. Let's break down its key features:

#### **State Management Strategy**
```jsx
const [activeTab, setActiveTab] = useState('overview');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [appointments, setAppointments] = useState([]);
const [doctors, setDoctors] = useState([]);
const [patientRecord, setPatientRecord] = useState(null);
```

**State Explained:**
- **activeTab**: Controls which section of the dashboard is displayed
- **loading**: Prevents multiple simultaneous API calls and shows loading states
- **error**: Centralized error handling for better UX
- **appointments**: Cached patient appointments to avoid repeated API calls
- **doctors**: List of available doctors for booking
- **patientRecord**: Patient's medical record data

#### **Data Loading Pattern**
```jsx
const loadDashboardData = async () => {
  try {
    setLoading(true);
    setError('');

    const [appointmentsRes, doctorsRes] = await Promise.all([
      apiClient.get('/appointments/patient/my-appointments'),
      apiClient.get('/doctors')
    ]);

    setAppointments(appointmentsRes.data || []);
    setDoctors(doctorsRes.data || []);
  } catch (err) {
    console.error('Error loading dashboard data:', err);
    setError('Failed to load dashboard data. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

**Performance Optimizations:**
1. **Parallel Loading**: Uses `Promise.all()` to load multiple resources simultaneously
2. **Error Boundaries**: Wrapped in `ErrorBoundary` components to prevent crashes
3. **Conditional Loading**: Only loads data when needed (tab switching)
4. **Caching**: Stores loaded data in state to avoid repeated API calls

#### **Table Components with Pagination**
```jsx
const appointmentColumns = [
  { header: 'Doctor', cell: apt => `Dr. ${safeRender(apt.doctorUser?.firstName)} ${safeRender(apt.doctorUser?.lastName)}` },
  { header: 'Date', cell: apt => safeDate(apt.appointmentDateTime) },
  { header: 'Time', cell: apt => safeTime(apt.appointmentDateTime) },
  { header: 'Status', cell: apt => (
      <span className={`status ${apt.status?.toLowerCase()}`}>
        {safeRender(apt.status)}
      </span>
    )
  }
];
```

**Table Features:**
- **Dynamic Columns**: Configurable column definitions for reusability
- **Safe Rendering**: `safeRender()` prevents errors from null/undefined data
- **Status Styling**: Dynamic CSS classes based on appointment status
- **Action Buttons**: Conditional rendering based on appointment state and timing

### 7.2. Authentication Flow Deep Dive

#### **Login Component Analysis**
```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setLoginError('');
  
  try {
    const response = await login(formData);
    
    if (response.success) {
      if (response.token) {
        sessionStorage.setItem('token', response.token);
      }
      // Navigation handled by AuthContext
    } else {
      setLoginError(response.message || 'Login failed. Please try again.');
    }
  } catch (error) {
    setLoginError(error.message || 'Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

**Security Features:**
1. **Token Storage**: Uses `sessionStorage` (cleared when browser closes)
2. **Error Handling**: Graceful handling of network and authentication errors
3. **Loading States**: Prevents double-submission during login process
4. **Form Validation**: Client-side validation for better UX

#### **AuthContext Global State**
```jsx
const login = async (credentials) => {
  try {
    const response = await authService.login(credentials);
    
    if (response.success) {
      sessionStorage.setItem('token', response.token);
      
      const initialUser = {
        id: response.id,
        userId: response.id,
        username: response.username,
        role: response.role
      };
      
      setUser(initialUser);
      
      // Load full profile asynchronously
      const profileResponse = await authService.getUserProfile();
      setUser(prevUser => ({
        ...prevUser,
        ...profileResponse
      }));
    }
  } catch (error) {
    // Error handling
  }
};
```

**Optimized Loading Strategy:**
1. **Immediate Response**: Sets basic user data immediately for fast UI updates
2. **Progressive Enhancement**: Loads detailed profile data in background
3. **Graceful Degradation**: Works even if profile loading fails
4. **Notification Integration**: Initializes notification system after login

---

## 8. Backend Service Architecture

### 8.1. AppointmentService - Complex Business Logic

#### **Date/Time Handling**
```java
private static final DateTimeFormatter[] SUPPORTED_FORMATTERS = {
    DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"),
    DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
    DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"),
    DateTimeFormatter.ISO_LOCAL_DATE_TIME
};

private LocalDateTime parseDateTime(String dateTimeStr) {
    for (DateTimeFormatter formatter : SUPPORTED_FORMATTERS) {
        try {
            return LocalDateTime.parse(dateTimeStr, formatter);
        } catch (DateTimeParseException e) {
            // Try next formatter
        }
    }
    throw new IllegalArgumentException("Unable to parse date: " + dateTimeStr);
}
```

**Why Multiple Formatters?**
- **Frontend Flexibility**: Different frontend libraries may send different formats
- **API Compatibility**: Supports various client implementations
- **Timezone Handling**: Consistent parsing regardless of input format
- **Error Prevention**: Graceful handling of date format variations

#### **Privacy Implementation**
```java
private User sanitizePatientData(User patient) {
    if (patientPrivacyService.getPrivacySettings(patient.getUserId())) {
        User sanitized = new User();
        sanitized.setUserId(patient.getUserId());
        sanitized.setUsername("Anonymous");
        sanitized.setEmail("private@example.com");
        return sanitized;
    }
    return patient;
}
```

**Privacy Features:**
- **Data Masking**: Replaces sensitive information with generic values
- **Selective Disclosure**: Maintains necessary IDs for system functionality
- **Role-Based**: Different privacy levels based on user relationships
- **Audit Trail**: Maintains logs while protecting sensitive data

### 8.2. AuthService - Security Implementation

#### **Password Security**
```java
@Autowired
private PasswordEncoder passwordEncoder;

// During registration
String hashedPassword = passwordEncoder.encode(plainPassword);
user.setPasswordHash(hashedPassword);

// During login validation
boolean isValidPassword = passwordEncoder.matches(providedPassword, storedHash);
```

**Security Measures:**
- **bcrypt Hashing**: Industry-standard password hashing algorithm
- **Salt Generation**: Automatic salt generation prevents rainbow table attacks
- **Adaptive Cost**: Configurable work factor to stay ahead of hardware improvements
- **No Plain Text**: Passwords never stored or logged in plain text

#### **JWT Token Management**
```java
@Autowired
private JwtTokenProvider tokenProvider;

// Token generation
String token = tokenProvider.generateToken(userDetails);

// Token validation
boolean isValid = tokenProvider.validateToken(token);
String username = tokenProvider.getUsernameFromToken(token);
```

**Token Features:**
- **Stateless Authentication**: No server-side session storage required
- **Expiration**: Configurable token lifetime (default 24 hours)
- **Claims**: Contains user ID, username, and role information
- **Signature Verification**: Prevents token tampering

---

## 9. API Design Patterns

### 9.1. RESTful Endpoint Structure

#### **Authentication Endpoints**
```
POST /api/auth/register     - User registration
POST /api/auth/login        - User authentication
GET  /api/auth/me          - Get current user profile
PUT  /api/auth/profile     - Update user profile
POST /api/auth/logout      - Logout user
```

#### **Appointment Management**
```
GET    /api/appointments/patient/my-appointments  - Get patient's appointments
POST   /api/appointments/book                     - Book new appointment
PUT    /api/appointments/{id}/cancel              - Cancel appointment
GET    /api/doctors/{id}/available-slots          - Get doctor availability
```

#### **Medical Records**
```
GET  /api/patient-records/my-record    - Get patient's medical record
PUT  /api/patient-records/my-record    - Update medical record
POST /api/patient-records/upload-image - Upload medical images
```

### 9.2. Response Patterns

#### **Success Response**
```json
{
  "success": true,
  "data": {
    "appointmentId": 123,
    "doctorName": "Dr. Smith",
    "status": "Scheduled"
  },
  "message": "Appointment booked successfully"
}
```

#### **Error Response**
```json
{
  "success": false,
  "message": "Doctor not available at requested time",
  "errors": [
    {
      "field": "appointmentDateTime",
      "message": "Time slot already booked"
    }
  ]
}
```

#### **Validation Error Response**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "username",
      "message": "Username is required"
    },
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## 10. Testing and Quality Assurance

### 10.1. Frontend Testing Strategy

#### **Component Testing**
```jsx
// Example test for Login component
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';

test('displays error message on failed login', async () => {
  render(<Login />);
  
  const usernameInput = screen.getByLabelText(/username/i);
  const passwordInput = screen.getByLabelText(/password/i);
  const submitButton = screen.getByRole('button', { name: /sign in/i });
  
  fireEvent.change(usernameInput, { target: { value: 'testuser' } });
  fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
  fireEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText(/login failed/i)).toBeInTheDocument();
  });
});
```

#### **API Service Testing**
```javascript
// Mock API responses for testing
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import authService from './authService';

const mock = new MockAdapter(axios);

test('login service returns success response', async () => {
  mock.onPost('/auth/login').reply(200, {
    token: 'fake-jwt-token',
    id: 1,
    username: 'testuser',
    role: 'Patient'
  });
  
  const result = await authService.login({
    username: 'testuser',
    password: 'password'
  });
  
  expect(result.success).toBe(true);
  expect(result.token).toBe('fake-jwt-token');
});
```

### 10.2. Backend Testing Strategy

#### **Unit Testing Services**
```java
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private PasswordEncoder passwordEncoder;
    
    @InjectMocks
    private AuthService authService;
    
    @Test
    void registerUser_Success() {
        // Given
        RegisterRequest request = new RegisterRequest();
        request.setUsername("testuser");
        request.setEmail("test@example.com");
        request.setPassword("password");
        
        when(userRepository.findByUsername("testuser"))
            .thenReturn(Optional.empty());
        when(passwordEncoder.encode("password"))
            .thenReturn("hashedPassword");
        
        // When
        MessageResponse response = authService.registerUser(request);
        
        // Then
        assertTrue(response.isSuccess());
        verify(userRepository).save(any(User.class));
    }
}
```

#### **Integration Testing**
```java
@SpringBootTest
@AutoConfigureTestDatabase
@Transactional
class AppointmentControllerIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    void bookAppointment_ValidRequest_ReturnsSuccess() {
        // Given
        BookAppointmentRequest request = new BookAppointmentRequest();
        request.setDoctorId(1);
        request.setAppointmentDateTime("2024-12-01T10:00:00");
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth("valid-jwt-token");
        HttpEntity<BookAppointmentRequest> entity = new HttpEntity<>(request, headers);
        
        // When
        ResponseEntity<AppointmentResponse> response = restTemplate.postForEntity(
            "/api/appointments/book", entity, AppointmentResponse.class);
        
        // Then
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody().getAppointmentId());
    }
}
```

---

## 11. Deployment and Production Considerations

### 11.1. Database Configuration

#### **Production Settings**
```properties
# Production database configuration
spring.datasource.url=jdbc:sqlserver://production-server:1433;databaseName=hiv_clinic_prod
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

# Production JPA settings
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false

# Connection pool optimization
spring.datasource.hikari.maximum-pool-size=50
spring.datasource.hikari.minimum-idle=10
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
```

#### **Security Configuration**
```properties
# JWT security
app.jwt.secret=${JWT_SECRET_KEY}
app.jwt.expiration-ms=3600000

# CORS configuration
app.cors.allowed-origins=${ALLOWED_ORIGINS}

# SSL configuration
server.ssl.enabled=true
server.ssl.key-store=${SSL_KEYSTORE_PATH}
server.ssl.key-store-password=${SSL_KEYSTORE_PASSWORD}
```

### 11.2. Frontend Build Configuration

#### **Production Build**
```javascript
// vite.config.js for production
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          api: ['axios']
        }
      }
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL)
  }
});
```

#### **Environment Variables**
```bash
# Frontend (.env.production)
VITE_API_URL=https://api.hivclinic.com
VITE_APP_NAME=HIV Clinic Management System

# Backend (application-prod.properties)
DB_USERNAME=clinic_app_user
DB_PASSWORD=secure_password_here
JWT_SECRET_KEY=super_secret_jwt_key_here
ALLOWED_ORIGINS=https://hivclinic.com,https://www.hivclinic.com
```

---

## 12. Maintenance and Monitoring

### 12.1. Logging Strategy

#### **Backend Logging**
```java
// Structured logging in services
@Service
public class AppointmentService {
    private static final Logger logger = LoggerFactory.getLogger(AppointmentService.class);
    
    public AppointmentDTO bookAppointment(BookAppointmentRequest request) {
        logger.info("Booking appointment - Patient: {}, Doctor: {}, DateTime: {}", 
                   request.getPatientId(), request.getDoctorId(), request.getDateTime());
        
        try {
            // Business logic
            AppointmentDTO result = processBooking(request);
            
            logger.info("Appointment booked successfully - ID: {}", result.getAppointmentId());
            return result;
        } catch (Exception e) {
            logger.error("Failed to book appointment - Patient: {}, Error: {}", 
                        request.getPatientId(), e.getMessage(), e);
            throw e;
        }
    }
}
```

#### **Frontend Error Tracking**
```javascript
// Error boundary with logging
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log to monitoring service
    console.error('React Error:', error);
    console.error('Error Info:', errorInfo);
    
    // Send to error tracking service (e.g., Sentry)
    if (window.analytics) {
      window.analytics.track('Frontend Error', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }
}
```

### 12.2. Performance Monitoring

#### **Database Performance**
```sql
-- Monitor slow queries
SELECT 
    query_text,
    execution_count,
    avg_duration_ms,
    max_duration_ms
FROM sys.query_store_query_text qt
JOIN sys.query_store_query q ON qt.query_text_id = q.query_text_id
JOIN sys.query_store_plan p ON q.query_id = p.query_id
JOIN sys.query_store_runtime_stats rs ON p.plan_id = rs.plan_id
WHERE rs.avg_duration > 1000  -- Queries taking more than 1 second
ORDER BY rs.avg_duration DESC;
```

#### **Application Metrics**
```java
// Custom metrics with Micrometer
@Component
public class AppointmentMetrics {
    private final Counter appointmentBookings;
    private final Timer appointmentProcessingTime;
    
    public AppointmentMetrics(MeterRegistry registry) {
        this.appointmentBookings = Counter.builder("appointments.booked")
            .description("Number of appointments booked")
            .register(registry);
            
        this.appointmentProcessingTime = Timer.builder("appointments.processing.time")
            .description("Time taken to process appointment booking")
            .register(registry);
    }
    
    public void recordBooking() {
        appointmentBookings.increment();
    }
    
    public Timer.Sample startProcessingTimer() {
        return Timer.start(appointmentProcessingTime);
    }
}
```

---

This completes the comprehensive documentation of the HIV Clinic Management System. Every component, from the high-level architecture down to individual code lines, has been explained in detail to help developers of all skill levels understand and work with this codebase effectively. The documentation covers:

1. **System Overview**: Architecture and technology stack explanation
2. **Backend Deep Dive**: Spring Boot components, services, and data flow
3. **Frontend Deep Dive**: React components, state management, and API integration
4. **Data Flow Walkthroughs**: Complete request-response cycles
5. **Getting Started Guide**: Step-by-step setup instructions
6. **Entity Relationships**: Database schema and relationships
7. **Advanced Component Analysis**: Detailed component breakdowns
8. **Backend Service Architecture**: Service layer patterns and security
9. **API Design Patterns**: RESTful endpoints and response formats
10. **Testing Strategy**: Frontend and backend testing approaches
11. **Deployment Considerations**: Production configuration and optimization
12. **Maintenance and Monitoring**: Logging, performance monitoring, and metrics

This documentation serves as a complete reference for understanding, maintaining, and extending the HIV Clinic Management System.