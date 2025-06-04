# HIV Medical Treatment System - Backend

A comprehensive Spring Boot backend API for managing HIV medical treatment with appointment booking functionality.

## Features

- User authentication and role-based access control with JWT
- RESTful API for appointment booking and management
- Doctor availability management
- Patient and doctor profile management
- Admin dashboard API endpoints
- Microsoft SQL Server integration

## Technology Stack

### Backend

- Spring Boot 3.2.0
- Spring Security with JWT authentication
- Spring Data JPA
- Microsoft SQL Server
- Maven

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
### Appointments
- `GET /api/appointments/patient/my-appointments` - Get patient appointments
- `GET /api/appointments/doctor/my-appointments` - Get doctor appointments
- `POST /api/appointments/book` - Book new appointment
- `PUT /api/appointments/{id}/cancel` - Cancel appointment

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/{id}/available-slots` - Get doctor availability
- `POST /api/doctors/availability` - Add availability slot
- `DELETE /api/doctors/availability/{id}` - Remove availability slot

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/doctors` - Get all doctors
- `GET /api/admin/appointments` - Get all appointments
- `POST /api/admin/doctors` - Create doctor account
## Getting Started

### Prerequisites

- Java 17 or higher
- Maven 3.6+
- Microsoft SQL Server

### Database Setup

1. Run the database setup script:

