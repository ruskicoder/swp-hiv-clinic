# SWP391 Project Scope Definition
## HIV Clinic Appointment Booking System - Academic Project Boundaries

### Document Information
- **Project**: SWP391 Software Development Project
- **System**: HIV Clinic Appointment Booking System
- **Approach**: Bounded scope development with existing system foundation
- **Focus**: Academic learning objectives within defined functional boundaries

---

## 1. Current System State Analysis

### 1.1 Existing Infrastructure (Foundation - DO NOT MODIFY)
These components exist and are considered **baseline infrastructure**:

#### **Database Schema (Complete - 15+ tables)**
- **User Management**: [`Users`](src/main/resources/db/schema.sql:19), [`Roles`](src/main/resources/db/schema.sql:13), [`DoctorProfiles`](src/main/resources/db/schema.sql:41), [`PatientProfiles`](src/main/resources/db/schema.sql:53)
- **Appointment System**: [`Appointments`](src/main/resources/db/schema.sql:80), [`DoctorAvailabilitySlots`](src/main/resources/db/schema.sql:66), [`AppointmentStatusHistory`](src/main/resources/db/schema.sql:116)
- **Medical Records**: [`PatientRecords`](src/main/resources/db/schema.sql:138), [`ARVTreatments`](src/main/resources/db/schema.sql:155)
- **Notification Infrastructure**: [`Notifications`](src/main/resources/db/schema.sql:175), [`NotificationTemplates`](src/main/resources/db/schema.sql:251), [`MedicationRoutines`](src/main/resources/db/schema.sql:195)
- **System Management**: [`SystemSettings`](src/main/resources/db/schema.sql:96), [`LoginActivity`](src/main/resources/db/schema.sql:127), [`PasswordResetTokens`](src/main/resources/db/schema.sql:106)

#### **Backend Services (Functional - Core Business Logic)**
- **Comprehensive Appointment Management**: [`AppointmentService`](src/main/java/com/hivclinic/service/AppointmentService.java:25) with 663 lines of production-ready code
- **User Authentication & Authorization**: Role-based access control system
- **Notification System**: [`NotificationSchedulingService`](src/main/java/com/hivclinic/service/NotificationSchedulingService.java:1) with template-based automated reminders
- **Privacy & Security**: Patient data sanitization and privacy controls
- **Medical Record Management**: HIV-specific treatment tracking and ARV regimen management

#### **Application Framework (Established)**
- **Spring Boot**: [`@SpringBootApplication`](src/main/java/com/hivclinic/HivClinicBackendApplication.java:7) with scheduling enabled
- **Database Integration**: Microsoft SQL Server with JPA/Hibernate
- **REST API Architecture**: Controller-Service-Repository pattern
- **Security Framework**: Authentication and authorization infrastructure

### 1.2 Partially Implemented Components (Extension Points)
These components have foundation but require completion:

#### **Frontend Components (React)**
- **Dashboard Framework**: [`DashboardHeader`](src/components/layout/DashboardHeader.jsx:1) component exists
- **Notification Management**: [`NotificationManagementDashboard`](src/components/notifications/NotificationManagementDashboard.jsx:1) component exists
- **Styling Foundation**: [`DoctorDashboard.css`](src/features/Doctor/DoctorDashboard.css:1) exists
- **Service Layer**: [`notificationService.js`](src/services/notificationService.js:1) exists

### 1.3 Intentionally Excluded Components (Out of Scope)
These components do NOT exist and are **intentionally excluded** from the current project scope:
- **Advanced Reporting System**: Business intelligence and analytics
- **Integration with External Health Systems**: HL7 FHIR, hospital information systems
- **Mobile Application**: Native mobile app development
- **Advanced Security Features**: Two-factor authentication, advanced encryption
- **Multi-tenant Architecture**: Support for multiple clinic locations
- **Advanced Workflow Management**: Complex approval processes
- **Real-time Chat System**: Patient-doctor communication
- **Advanced Payment Processing**: Billing and insurance integration

---

## 2. SWP391 Project Scope Definition

### 2.1 Core Learning Objectives Alignment

#### **CLO1: Requirements Analysis (Academic Focus)**
- **Scope**: Analyze existing system requirements and document enhancement specifications
- **Deliverables**: 
  - Requirements traceability matrix for selected features
  - Stakeholder analysis for HIV clinic domain
  - Use case documentation for core appointment booking workflow
- **Boundaries**: Focus on 3-4 core use cases, not comprehensive system analysis

#### **CLO2: MVC Design Pattern & OOP (Technical Focus)**
- **Scope**: Implement clean MVC architecture for selected frontend components
- **Deliverables**:
  - Component-based React architecture following MVC principles
  - Service layer implementation demonstrating OOP principles
  - Database access patterns using Repository pattern
- **Boundaries**: Focus on 2-3 major components, not entire system architecture

#### **CLO3: Web Programming Proficiency (Implementation Focus)**
- **Scope**: Complete functional web application for core appointment booking
- **Deliverables**:
  - Full-stack appointment booking workflow
  - User authentication and role-based access
  - Responsive web interface
- **Boundaries**: Core booking functionality only, not advanced features

#### **CLO4: Professional Working Attitudes (Process Focus)**
- **Scope**: Demonstrate professional software development practices
- **Deliverables**:
  - Git workflow with proper branching and code review
  - Professional documentation and coding standards
  - Team collaboration and project management
- **Boundaries**: Academic project management, not enterprise-level processes

#### **CLO5: Presentation & Communication (Communication Focus)**
- **Scope**: Demonstrate technical communication skills
- **Deliverables**:
  - Technical presentations for each iteration
  - User documentation and system guides
  - Academic reflection on development process
- **Boundaries**: Academic presentation format, not client-facing materials

### 2.2 Specific Functional Scope

#### **Phase 1: Core Appointment Booking (Iteration 1)**
**Target LOC**: 180 per team member
**Academic Focus**: Requirements analysis and basic MVC implementation

**IN SCOPE - Must Implement**:
1. **Patient Registration & Login**
   - User registration form with validation
   - Login system with role-based redirection
   - Basic patient profile management

2. **Doctor Availability Display**
   - Calendar view of available appointment slots
   - Doctor profile information display
   - Specialty-based filtering

3. **Basic Appointment Booking**
   - Appointment request form
   - Conflict validation and error handling
   - Booking confirmation workflow

**OUT OF SCOPE - Will NOT Implement**:
- Advanced calendar features (recurring appointments, complex scheduling)
- Payment processing or billing integration
- Advanced search and filtering options
- Real-time availability updates
- Multi-language support

#### **Phase 2: Enhanced User Experience (Iteration 2)**
**Target LOC**: 240 per team member (cumulative: 420)
**Academic Focus**: Advanced MVC patterns and user interface design

**IN SCOPE - Must Implement**:
1. **User Dashboard Development**
   - Patient dashboard with upcoming appointments
   - Doctor dashboard with patient list
   - Basic appointment management (view, cancel)

2. **Notification System Integration**
   - Display system notifications to users
   - Basic notification preferences
   - Appointment reminder display

3. **Enhanced UI/UX**
   - Responsive design implementation
   - Form validation and user feedback
   - Basic accessibility features

**OUT OF SCOPE - Will NOT Implement**:
- Real-time push notifications
- Advanced notification scheduling
- Complex dashboard analytics
- Advanced user customization options
- Social media integration

#### **Phase 3: System Integration (Iteration 3)**
**Target LOC**: 660 per team member (cumulative)
**Academic Focus**: Complete system integration and testing

**IN SCOPE - Must Implement**:
1. **Complete Appointment Workflow**
   - End-to-end appointment booking process
   - Appointment status management
   - Basic appointment history

2. **Role-Based Access Control**
   - Complete authentication system
   - Permission-based feature access
   - User role management interface

3. **System Testing & Documentation**
   - Comprehensive system testing
   - User documentation creation
   - Technical documentation completion

**OUT OF SCOPE - Will NOT Implement**:
- Advanced reporting and analytics
- Integration with external systems
- Advanced security features
- Performance optimization
- Scalability enhancements

### 2.3 Technical Implementation Boundaries

#### **Frontend Development Scope**
**Technology Stack**: React 18+ with TypeScript
**Components to Implement**:
- User Authentication Forms (Login, Register)
- Patient Dashboard (Appointments, Profile)
- Doctor Dashboard (Schedule, Patients)
- Appointment Booking Interface
- Notification Display Component

**Components NOT to Implement**:
- Advanced calendar widgets
- Real-time chat interfaces
- Complex form builders
- Advanced data visualization
- Mobile-responsive navigation

#### **Backend Integration Scope**
**Existing Services to Utilize** (DO NOT MODIFY):
- [`AppointmentService`](src/main/java/com/hivclinic/service/AppointmentService.java:25) - Use existing booking logic
- [`NotificationSchedulingService`](src/main/java/com/hivclinic/service/NotificationSchedulingService.java:1) - Use existing notification system
- Authentication services - Use existing user management

**New Services to Implement**:
- Frontend-specific API endpoints
- Data transformation services for UI
- Client-side validation services

**Services NOT to Implement**:
- Advanced business logic (already exists)
- Complex data processing
- External system integrations
- Advanced security services

#### **Database Interaction Scope**
**Existing Schema to Use** (DO NOT MODIFY):
- All existing tables and relationships
- Existing constraints and indexes
- Existing stored procedures or functions

**New Database Work**:
- Only UI-specific queries through existing services
- No new tables or schema modifications
- No direct database manipulation

---

## 3. Academic Project Constraints

### 3.1 Time Allocation Constraints
- **Total Project Time**: 60 sessions (45 minutes each) = 45 hours contact time
- **Team Size**: 4-5 members
- **Individual Effort**: 150 hours total per student (105 hours self-study)
- **Realistic Scope**: Focus on learning objectives, not comprehensive system development

### 3.2 Learning Outcome Constraints
- **Academic Assessment**: 70% based on individual LOC contribution
- **Documentation Requirements**: Academic-level documentation (RDS, SDS)
- **Team Collaboration**: Emphasis on team learning and peer review
- **Presentation Skills**: Regular demonstrations and academic presentations

### 3.3 Technical Constraints
- **Technology Stack**: Must use Java Spring Boot backend, React frontend
- **Database**: Must use Microsoft SQL Server
- **Development Tools**: Academic licenses and university-approved tools
- **Deployment**: Local development environment, no production deployment

### 3.4 Resource Constraints
- **Faculty Support**: Limited to academic guidance, not technical consulting
- **Infrastructure**: University lab resources and academic accounts
- **External Dependencies**: Minimal use of external APIs or third-party services
- **Budget**: No budget for premium tools or services

---

## 4. Project Success Criteria

### 4.1 Functional Success Criteria
1. **Core Appointment Booking**: Complete patient-doctor appointment booking workflow
2. **User Authentication**: Role-based access control with Patient/Doctor/Admin roles
3. **Basic Dashboard**: Functional user dashboards for each role
4. **Notification Display**: Integration with existing notification system
5. **Responsive Design**: Mobile-friendly interface design

### 4.2 Academic Success Criteria
1. **LOC Achievement**: 720+ lines of code per team member
2. **Documentation Quality**: Academic-standard RDS and SDS documents
3. **Code Quality**: Professional coding standards and best practices
4. **Team Collaboration**: Effective use of Git and project management tools
5. **Presentation Excellence**: Professional technical presentations

### 4.3 Technical Success Criteria
1. **System Integration**: Successful integration with existing backend services
2. **Code Quality**: Clean, maintainable, and well-documented code
3. **Testing Coverage**: Comprehensive testing of implemented features
4. **Performance**: Acceptable performance for academic demonstration
5. **Security**: Basic security practices and data protection

### 4.4 Professional Success Criteria
1. **Industry Standards**: Following professional development practices
2. **Documentation**: Professional-quality user and technical documentation
3. **Collaboration**: Effective team collaboration and communication
4. **Problem Solving**: Demonstrated ability to solve technical challenges
5. **Continuous Learning**: Evidence of skill development and learning

---

## 5. Implementation Strategy

### 5.1 Incremental Development Approach
1. **Start with Existing Foundation**: Leverage existing backend services
2. **Focus on Frontend Implementation**: Build React components using existing APIs
3. **Prioritize Core Features**: Implement essential functionality first
4. **Iterative Enhancement**: Add features incrementally across iterations
5. **Continuous Integration**: Regular testing and integration

### 5.2 Risk Mitigation Strategy
1. **Scope Creep Prevention**: Strict adherence to defined boundaries
2. **Technical Complexity Management**: Use existing services to reduce complexity
3. **Time Management**: Regular sprint reviews and scope adjustments
4. **Quality Assurance**: Continuous testing and code review
5. **Academic Alignment**: Regular faculty consultation and feedback

### 5.3 Team Collaboration Framework
1. **Role Definition**: Clear roles aligned with learning objectives
2. **Communication Protocols**: Regular stand-ups and progress reviews
3. **Knowledge Sharing**: Peer learning and cross-training
4. **Documentation Standards**: Consistent academic and technical documentation
5. **Quality Standards**: Shared code quality and professional standards

---

## 6. Conclusion

This project scope definition establishes clear boundaries for the SWP391 academic project while leveraging the existing HIV Clinic Appointment Booking System as a foundation. The scope focuses on:

- **Academic Learning**: Achieving all course learning outcomes through practical implementation
- **Technical Proficiency**: Demonstrating web development skills with modern technologies
- **Professional Development**: Building industry-relevant skills and practices
- **Realistic Expectations**: Balancing academic requirements with practical constraints

The defined scope ensures that students will gain comprehensive experience in software development while working within realistic constraints and leveraging existing system infrastructure. This approach maximizes learning outcomes while minimizing unnecessary complexity and scope creep.

**Key Principle**: Focus development efforts exclusively on the specific functions identified within the project parameters, while designing the architecture to accommodate planned future enhancements.